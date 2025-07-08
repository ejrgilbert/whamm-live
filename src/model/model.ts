import { ExtensionContext } from "../extensionContext";
import { WhammWebviewPanel } from "../user_interface/webviewPanel";
import { FSM } from "../model/fsm";
import { WhammResponse } from "./types";
import * as vscode from 'vscode';
import { whammServer } from "../whammServer";

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
    fsm_mappings: FSM | undefined;

    constructor(webview: WhammWebviewPanel){
        this.webview = webview;
        this.no_error_response = null;
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

                // create the mappings
                this.update();

                return [true, "success"];
            } catch(error){
                // do nothing since webviewPanel will handle all the related stuff with disposing
            }
        };
        return [false, "Whamm setup failed"];
    }

    // Call the whamm API to update the model
    async update(): Promise<boolean>{
        let file_path: string | undefined = ExtensionContext.context.workspaceState.get('whamm-file');
        if (file_path && this.webview.fileName){

            let file_contents = await APIModel.loadFileAsString(file_path, ExtensionContext.context);
            if (!ExtensionContext.api.noChange(file_contents)){
                try{
                    // Call the whamm API to get the response
                    this.response = ExtensionContext.api.run(file_contents, this.webview.fileName, file_path);
                    this.no_error_response = this.response;

                    // update the mappings now
                    this.update_mappings();
                } catch {
                    // handle error response
                    // TODO
                }

            } else{
                // nothing to change
                return true;
            }
        }
        // unable to update since no whamm file
        return false;
    }

    update_mappings(){
        // TODO
    }

    static async loadFileAsString(path: string, context: vscode.ExtensionContext): Promise<string> {
        const encoded = await vscode.workspace.fs.readFile(vscode.Uri.file(context.asAbsolutePath(path)));
        return new TextDecoder('utf-8').decode(encoded);
    }
}
