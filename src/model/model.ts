import { ExtensionContext } from "../extensionContext";
import { WhammWebviewPanel } from "../user_interface/webviewPanel";
import { FSM } from "../model/fsm";
import * as vscode from 'vscode';
import { ModelHelper } from "./utils/model_helper";
import { WhammLiveInjections } from "./types";
import { Cell } from "./utils/cell";

// Class to store API responses [ MVC pattern's model ] 
export class APIModel{
    static whamm_file_changing: boolean = false;

    // will be null if wizard option chosen
    valid_wat_content!: string ;
    valid_wasm_content!: Uint8Array;

    injected_wat_content!: string;
    jagged_array: (Cell|null)[][];

    webview: WhammWebviewPanel;
    // Will always be the latest API response with no error or 'null'
    fsm_mappings: FSM | null;

    /**
     *  @todo: Remove every `injected_fsm_mappings` usage in this and model_helper.ts file upon
     **/
    // orca ( or wirm as they now say it) funcID fix
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
                    var response = ExtensionContext.api.run(file_contents, this.webview.fileName, file_path);
                } catch (err){
                    // handle error response
                    // TODO
                    console.log(err);
                    throw err;
                }

                    let whamm_live_mappings = ModelHelper.create_whamm_data_type_to_whamm_injection_mapping(response);

                    // store the new fsm mappings to account for funcID changes
                    if (this.fsm_mappings != null){
                        
                        /**
                         *  @todo: Remove once orca fixes the injected fsm mappings and pass in `this.fsm_mappings` instead of `this.injected_fsm_mappings`
                         *          for the `ModelHelper.create_whamm_live_injection_instances` static method
                         **/
                        this.injected_fsm_mappings = ModelHelper.update_fsm_funcIDs(this.fsm_mappings, whamm_live_mappings);
                        let whamm_live_injections = ModelHelper.create_whamm_live_injection_instances(this.injected_fsm_mappings, whamm_live_mappings)

                        // update the injected wat content
                        this.injected_wat_content = ModelHelper.inject_wat(this.valid_wat_content, whamm_live_injections.injecting_injections, whamm_live_injections.lines_injected).join('\n');
                        // update the jagged array
                        this.update_jagged_array(whamm_live_injections);

                        // success so return true
                        return true;
                    } else{
                        throw new Error("FSM setup error: FSM mappings shouldn't be null");
                    }


            } else{
                // nothing to change
                return true;
            }
        }
        // unable to update since no whamm file
        return false;
    }

    async update_jagged_array(response: WhammLiveInjections){
        let whamm_file: string | undefined= ExtensionContext.context.workspaceState.get("whamm-file");
        if (whamm_file !== undefined){
            // load the whamm file into a new jagged array
            let whamm_file_contents = await APIModel.loadFileAsString(whamm_file, ExtensionContext.context);
            this.jagged_array = ModelHelper.create_jagged_array(whamm_file_contents);

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
        } else
            throw new Error("No whamm file selected! Should not be able to `update` the model");
    }

    // file related helper methods
    static async loadFileAsString(path: string, context: vscode.ExtensionContext): Promise<string> {
        const encoded = await vscode.workspace.fs.readFile(vscode.Uri.file(path));
        return new TextDecoder('utf-8').decode(encoded);
    }
}
