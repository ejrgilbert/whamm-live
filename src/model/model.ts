import { ExtensionContext } from "../extensionContext";
import { WhammWebviewPanel } from "../user_interface/webviewPanel";
import { FSM } from "../model/fsm";
import * as vscode from 'vscode';
import { ModelHelper } from "./utils/model_helper";
import { WhammLiveInjection, WhammLiveResponse } from "./types";
import { Cell } from "./utils/cell";
import { Types } from "../whammServer";
import { show_and_handle_error_response } from "../extensionListeners/documentChangesListener";
import { Helper_sidebar_provider } from "../user_interface/sidebarProviderHelper";
import { SvelteModel } from "./svelte_model";

// Class to store API responses [ MVC pattern's model ] 
export class APIModel{
    static whamm_file_changing: boolean = false;
    api_response_setup_completed: boolean = false;
    __api_response_out_of_date!: boolean;
    // svelte side code updated or not
    codemirror_code_updated!: boolean;

    static whamm_cached_content: string;
    // will be null if wizard option chosen
    valid_wat_content!: string ;
    valid_wasm_content!: Uint8Array;
    whamm_live_response!: WhammLiveResponse;

    // key is the wat line number and value is the whamm live injection at that line number
    wat_to_whamm_mapping: Map<number, WhammLiveInjection> = new Map();

    injected_wat_content!: string;
    jagged_array: (Cell|null)[][];

    webview: WhammWebviewPanel;
    fsm_mappings: FSM | null;
    // funcID's change if whamm injects functions/ func imports
    // So, we need to a mapping to handle that 
    injected_fsm_mappings: FSM | null;

    constructor(webview: WhammWebviewPanel){
        this.webview = webview;
        this.fsm_mappings = this.injected_fsm_mappings = null;
        this.jagged_array = [];
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
    async setup(): Promise<[boolean, string]>{
        this.api_response_out_of_date = true;
        this.codemirror_code_updated = false;

        // loadWatAndWasm should have been called to load the content
        let whamm_contents = await Helper_sidebar_provider.helper_get_whamm_file_contents();
        if (this.webview.fileName && this.valid_wasm_content && this.valid_wat_content && whamm_contents){
            try{
                // setup in rust side
                ExtensionContext.api.setup(this.webview.fileName, this.valid_wasm_content, whamm_contents);

                // use the fsm to have the mappings ready
                this.fsm_mappings = new FSM(this.valid_wat_content)
                this.fsm_mappings.run();
                // create the mappings
                // Handle like this show that the wat document can be rendered quick
                this.update(true).then((success) =>{
                    if (!success) {
                        vscode.window.showInformationMessage("Error: Failed to update the model");
                        this.webview.webviewPanel.dispose();
                        return;
                    }
                   this.api_response_out_of_date = false;
                   show_and_handle_error_response(whamm_contents, this.whamm_live_response.whamm_errors);
                });
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
        if (file_path && this.webview.fileName){

            var file_contents: string;
            let editor = vscode.window.activeTextEditor;
            if (editor?.document.uri.fsPath === file_path){
                file_contents = editor.document.getText();
            } else{
                file_contents = await APIModel.loadFileAsString(file_path, ExtensionContext.context);
            }

            if (force_update || !ExtensionContext.api.noChange(file_contents, Types.WhammTarget.Wasm(this.webview.fileName))){
                try{
                    // Call the whamm API to get the response
                    var response = ExtensionContext.api.run(file_contents, file_path, Types.WhammTarget.Wasm(this.webview.fileName));
                    let whamm_live_mappings = ModelHelper.create_whamm_data_type_to_whamm_injection_mapping(response);
                    // store the new fsm mappings to account for funcID changes
                    if (this.fsm_mappings != null){
                        
                        this.injected_fsm_mappings = ModelHelper.update_injected_fsm(this.fsm_mappings, whamm_live_mappings);
                        this.whamm_live_response = ModelHelper.create_whamm_live_injection_instances(this.injected_fsm_mappings, whamm_live_mappings)

                        // update the injected wat content
                        {
                            let [injected_wat_content, wat_to_whamm_mapping] = ModelHelper.inject_wat(this.valid_wat_content, this.whamm_live_response.injecting_injections, this.whamm_live_response.lines_injected.total_lines_injected);
                            ModelHelper.update_original_func_id_values(injected_wat_content, this.injected_fsm_mappings, this.whamm_live_response.lines_injected);
                            this.injected_wat_content = injected_wat_content.join('\n');
                            this.wat_to_whamm_mapping = wat_to_whamm_mapping;
                        }
                        // update the jagged array
                        this.update_jagged_array(this.whamm_live_response, file_contents);
                        // success so return true
                        return true;
                    } else{
                        throw new Error("FSM setup error: FSM mappings shouldn't be null");
                    }
                } catch (err){
                    if(err instanceof Types.ErrorWrapper.Error_){
                        ModelHelper.handle_error_response(this, err.cause.value);
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

    async update_jagged_array(response: WhammLiveResponse, file_contents: string){
        this.jagged_array = ModelHelper.create_jagged_array(file_contents);

        // loop over every injection
        // and for each injection's span
        // inject the wamm-live-injection object into that cell of the jagged array
        for (let injections of [response.injecting_injections, response.other_injections]){
            for (let whamm_live_injection of injections){
                if (whamm_live_injection.whamm_span === null) continue;

                // Get all the (line,col) pairs for the injection's span
                let line_col_values = ModelHelper.get_line_col_values(whamm_live_injection.whamm_span, this.jagged_array);
                let span_size = line_col_values.length;
                if (span_size <= 0) continue;

                // loop over each (line,col) pair and add the injection to its cell value
                for (let line_col of line_col_values){
                    let row = line_col[0] -1;
                    let col = line_col[1] -1;
                    let cell = this.jagged_array[row][col];
                    if (cell === null){
                        this.jagged_array[line_col[0] -1][line_col[1] -1] = new Cell(whamm_live_injection, span_size);
                    } else {
                        cell.add(whamm_live_injection, span_size);
                    }
                }
        }}
    }

    /* getter and setters */

    get api_response_out_of_date(){
        return this.__api_response_out_of_date;
    }

    // Updates the variables as well as notifies the svelte side by posting the messages
    set api_response_out_of_date(value: boolean){
        this.__api_response_out_of_date = value;
        this.codemirror_code_updated = false;
        SvelteModel.update_svelte_model(this.webview);
    }

    // set all models's api out of date and notify the related svelte side(s) only once!
    static set_api_out_of_date(value: boolean){
        for (let webview of WhammWebviewPanel.webviews){
            webview.model.__api_response_out_of_date = value;
            webview.model.codemirror_code_updated = false;
        }
        SvelteModel.update_svelte_models();
    }

    // file related helper static method(s)
    static async loadFileAsString(path: string, context: vscode.ExtensionContext): Promise<string> {
        const encoded = await vscode.workspace.fs.readFile(vscode.Uri.file(path));
        return new TextDecoder('utf-8').decode(encoded);
    }
}
