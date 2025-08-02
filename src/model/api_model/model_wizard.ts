import { ExtensionContext } from "../../extensionContext";
import * as vscode from 'vscode';
import { ModelHelper } from "../utils/model_helper";
import { WhammLiveResponseWizard } from "../types";
import { Types } from "../../whammServer";
import { APIModel } from "./model";
import { WizardWebviewPanel } from "../../user_interface/wizardWebviewPanel";
import { SvelteModel } from "../svelte_model";
import { show_and_handle_error_response } from "../../extensionListeners/documentChangesListener";

// Class to store API responses [ MVC pattern's model ] 
export class APIWizardModel extends APIModel{
    webview: WizardWebviewPanel;
    // @todo change it to Wizard
    whamm_live_response!: WhammLiveResponseWizard;

    constructor(webview: WizardWebviewPanel){
        super();
        this.webview = webview;
    }

    // setup initial mappings and other necessary stuff
    async setup(): Promise<[boolean, string]>{
        let whamm_contents = await super.setup_init();
        if (whamm_contents){
            try{
                // setup in rust side
                ExtensionContext.api.setupWizard(whamm_contents);
                this.update(true).then((success)=>{
                    if (!success) {
                        vscode.window.showInformationMessage("Error: Failed to update the model");
                        this.webview.webviewPanel.dispose();
                        return;
                    }
                    this.api_response_out_of_date = false;
                   show_and_handle_error_response(whamm_contents, this.whamm_live_response.whamm_errors);
                })
                this.api_response_setup_completed = true;
                return [true, "success"];

            } catch(error){
                // do nothing since webviewPanel will handle all the related stuff with disposing
            }
        };
        return [false, "Whamm setup failed"];
    }

    // Should have already called `setup`
    // Call the whamm API to update the model
    async update(force_update: boolean = false): Promise<boolean>{
        let file_path: string | undefined = ExtensionContext.context.workspaceState.get('whamm-file');
        if (file_path){

            var file_contents: string;
            let editor = vscode.window.activeTextEditor;
            if (editor?.document.uri.fsPath === file_path){
                file_contents = editor.document.getText();
            } else{
                file_contents = await APIModel.loadFileAsString(file_path, ExtensionContext.context);
            }

            if (force_update || !ExtensionContext.api.noChange(file_contents, Types.WhammTarget.Wizard())){
                try{
                    // Call the whamm API to get the response
                    let response = ExtensionContext.api.run(file_contents, file_path, Types.WhammTarget.Wizard());
                    let whamm_live_mappings = ModelHelper.create_whamm_data_type_to_whamm_injection_mapping(response);
                    this.whamm_live_response = ModelHelper.create_whamm_live_injection_instances_wizard(whamm_live_mappings);

                    // update the jagged array
                    this.update_jagged_array(this.whamm_live_response.injections, file_contents);
                    // success so return true
                    return true;

                } catch (err){
                    if(err instanceof Types.ErrorWrapper.Error_){
                        ModelHelper.handle_error_response_wizard(this, err.cause.value);
                        return true;
                    } else
                        return false;
                }

            } else{
                // nothing to change
                return true;
            }
        }
        // unable to update since no whamm file
        return false;
    }

    get api_response_out_of_date(): boolean{
        return this.__api_response_out_of_date;
    }

    // Updates the variables as well as notifies the svelte side by posting the messages
    set api_response_out_of_date(value: boolean){
        this.__api_response_out_of_date = value;
        this.codemirror_code_updated = false;
        SvelteModel.update_svelte_model(this.webview);
    }
}
