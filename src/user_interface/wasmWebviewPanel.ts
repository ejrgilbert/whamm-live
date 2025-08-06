import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';
import { LineHighlighterDecoration } from '../extensionListeners/utils/lineHighlighterDecoration';
import { Types } from '../whammServer';
import { WebviewPanel } from './webviewPanel';
import { APIWasmModel } from '../model/api_model/model_wasm';

export class WasmWebviewPanel extends WebviewPanel{

    fileName: string;
    is_wasm: boolean;
    
    // model which contains all the necessary information for APImodel data
    model: APIWasmModel;

    static number_of_webviews: number = 0;
    static webviews: WasmWebviewPanel[] = [];

    constructor(fileName: string){
        super(`Target: ${WasmWebviewPanel.get_trimmed_file_name(fileName)}`);
        this.fileName = fileName;
        this.is_wasm = this.fileName.endsWith(".wasm") || false;
        this.model = new APIWasmModel(this);
    }

    async init(){

        // Create a new webview panel
        WasmWebviewPanel.addPanel(this);

        // Handle disposing of the panel afterwards
        this.webviewPanel.onDidDispose(()=>{
                WasmWebviewPanel.removePanel(this);
        })

        let success = await this.model.loadWatAndWasm();
        let message = "Error parsing the wasm module! Make sure the file is valid";
        if (success){
            [success, message] = await this.model.setup();
        }
        if (!success) {
            vscode.window.showErrorMessage(message);
            this.webviewPanel.dispose();
        }
    }

    // Static methods
    private static addPanel(webview: WasmWebviewPanel){
        WasmWebviewPanel.number_of_webviews++;
        WasmWebviewPanel.webviews.push(webview);
    }

    static removePanel(webview: WasmWebviewPanel){
        WasmWebviewPanel.number_of_webviews--;
        WasmWebviewPanel.webviews.splice(WasmWebviewPanel.webviews.indexOf(webview), 1)

        WebviewPanel.endPanel(Types.WhammTarget.Wasm(webview.fileName));
    }

    // Main method to load the html
    async setupHTML(){
        super.loadHTML();
        super.postMessage({
                command: 'init-data',
                show_wizard: false,
                wat_content: this.model.valid_wat_content,
        });
        this.addListeners();
    }

    addListeners() {

        this.webviewPanel.webview.onDidReceiveMessage(
            message => {
                switch (message.command){
                    case 'codemirror-code-updated':
                        this.model.codemirror_code_updated = true;
                        break;
                    case 'wat-line-highlight':
                        LineHighlighterDecoration.highlight_whamm_live_injection(this, message.line);
                        break;
                    case 'wat-circle-highlight':
                        LineHighlighterDecoration.highlight_whamm_live_injection(this, message.id, true);
                        break;
                    case 'open-text-document':
                        ExtensionContext.openWatInNewColumn(message.contents);
                        break;
                }
            }
        )
    }

    static get_trimmed_file_name(filename: string){
        let file_path_array = filename.split('/');
        return file_path_array[file_path_array.length -1];
    }

}