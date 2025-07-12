import { ExtensionContext } from "../extensionContext";
import { WhammWebviewPanel } from "../user_interface/webviewPanel";
import { FSM } from "../model/fsm";
import * as vscode from 'vscode';
import { Types, whammServer } from "../whammServer";
import { ModelHelper } from "./utils/model_helper";
import { InjectType } from "./types";

// Class to store API responses [ MVC pattern's model ] 
export class APIModel{
    static whamm_file_changing: boolean = false;

    // will be null if wizard option chosen
    valid_wat_content!: string ;
    valid_wasm_content!: Uint8Array;

    response!: whammServer.InjectionPair[]; 
    webview: WhammWebviewPanel;
    // Will always be the latest API response with no error or 'null'
    no_error_response: whammServer.InjectionPair[] | null;
    fsm_mappings: FSM | null;
    injected_fsm_mappings: FSM | null;

    constructor(webview: WhammWebviewPanel){
        this.webview = webview;
        this.no_error_response = this.fsm_mappings = this.injected_fsm_mappings = null;
    }

    async loadWatAndWasm(): Promise<boolean>{
        if (this.webview.fileName){
            try{
                let file_content = await vscode.workspace.fs.readFile(vscode.Uri.file(this.webview.fileName));
                if (this.webview.is_wasm){
                    [this.valid_wat_content, this.valid_wasm_content] = ExtensionContext.api.wasm2watandwasm(file_content);
                } else
                    [this.valid_wat_content, this.valid_wasm_content]= ExtensionContext.api.wat2watandwasm(
                        new TextDecoder('utf-8').decode(file_content));
            } catch(error){
                return false;
            }
        }
        return true;
    }

    // setup initial mappings and other necessary stuff
    setup(): [boolean, string]{
        // loadWatAndWasm should have been called to load the content
        if (this.webview.fileName && this.valid_wasm_content && this.valid_wat_content){
            try{
                // setup in rust side
                ExtensionContext.api.setup(this.webview.fileName, this.valid_wasm_content, {asMonitorModule: false});

                // use the fsm to have the mappings ready
                this.fsm_mappings = new FSM(this.valid_wat_content)
                this.fsm_mappings.run();
                // create the mappings
                this.update(true);

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
        if (file_path && this.webview.fileName){

            let file_contents = await APIModel.loadFileAsString(file_path, ExtensionContext.context);
            if (force_update || !ExtensionContext.api.noChange(file_contents)){
                try{
                    // Call the whamm API to get the response
                    let response = ExtensionContext.api.run(file_contents, this.webview.fileName, file_path);
                    console.log(response);
                    let whamm_live_mappings = ModelHelper.create_whamm_data_type_to_whamm_injection_mapping(response);

                    this.no_error_response = response;
                    // store the new fsm mappings to account for funcID changes
                    if (this.fsm_mappings != null) this.injected_fsm_mappings = ModelHelper.update_fsm_funcIDs(this.fsm_mappings, whamm_live_mappings);

                    // update the mappings now
                    this.update_mappings();
                } catch {
                    // handle error response
                    // TODO
                }

            } else{
                // nothing to change
                console.log('no need to update now');
                return true;
            }
        }
        // unable to update since no whamm file
        return false;
    }

    update_mappings(){
        //TODO
    }

    // file related helper methods
    static async loadFileAsString(path: string, context: vscode.ExtensionContext): Promise<string> {
        const encoded = await vscode.workspace.fs.readFile(vscode.Uri.file(path));
        return new TextDecoder('utf-8').decode(encoded);
    }
}
