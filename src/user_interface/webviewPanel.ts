import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';
import { APIModel } from '../model/model';
import { LineHighlighterDecoration } from '../extensionListeners/lineHighlighterDecoration';
import { SvelteModel } from '../model/svelte_model';

export class WhammWebviewPanel{

    fileName: string | undefined;
    webviewPanel!: vscode.WebviewPanel;
    is_wasm: boolean;
    
    // Mapping from whamm script line number to
    // a tuple of injected content and lines in webview where it is injected
    line_to_probe_mapping: Map<number, [string, number[]]>
    
    // model which contains all the necessary information for APImodel data
    model: APIModel;

    static number_of_webviews: number = 0;
    static webviews: WhammWebviewPanel[] = [];

    constructor(fileName: string | undefined){
        this.fileName = fileName;
        this.is_wasm = this.fileName?.endsWith(".wasm") || false;
        this.line_to_probe_mapping = new Map();
        this.model = new APIModel(this);
    }

    async init(){

        // Create a new webview panel
        this.webviewPanel = vscode.window.createWebviewPanel(
            `live-whamm-webview-${WhammWebviewPanel.getNone()}`,
            'Live Whamm',
            vscode.ViewColumn.Active,
            {
                "enableScripts": true,
                "retainContextWhenHidden": true,
            }
        );
        WhammWebviewPanel.addPanel(this);

        // Handle disposing of the panel afterwards
        this.webviewPanel.onDidDispose(()=>{
                WhammWebviewPanel.removePanel(this);
                if (this.fileName) ExtensionContext.api.end(this.fileName);
                // update the sidebar
                SvelteModel.update_sidebar_model();

                // remove highlights if no webviews open
                if ((ExtensionContext.context.workspaceState.get("whamm-file") !== undefined) && WhammWebviewPanel.number_of_webviews == 0){
                    // remove decorations if any
                    LineHighlighterDecoration.clear_whamm_decorations();
                }
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
    private static addPanel(webview: WhammWebviewPanel){
        WhammWebviewPanel.number_of_webviews++;
        WhammWebviewPanel.webviews.push(webview);
    }

    static removePanel(webview: WhammWebviewPanel){
        WhammWebviewPanel.number_of_webviews--;
        WhammWebviewPanel.webviews.splice(WhammWebviewPanel.webviews.indexOf(webview), 1)
    }

    // Method used from online
    static getNone(){
        let text = "";
        const possible =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text; 
    }

    // Main method to load the html
    async loadHTML(){

        const css_src_1 = this.webviewPanel.webview.asWebviewUri(
            vscode.Uri.joinPath(ExtensionContext.context.extensionUri, 'media', 'vscode.css'));

        const css_src_2 = this.webviewPanel.webview.asWebviewUri(
            vscode.Uri.joinPath(ExtensionContext.context.extensionUri, 'media', 'reset.css'));

        const script_src = this.webviewPanel.webview.asWebviewUri(
            vscode.Uri.joinPath(ExtensionContext.context.extensionUri, 'svelte', 'dist', 'webview.js'));

        this.webviewPanel.webview.html =  `
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href=${css_src_1}>
                <link rel="stylesheet" href=${css_src_2}>
                <script>
                    const vscode = acquireVsCodeApi();
                </script>
                <script type="module" crossorigin src=${script_src}></script>
                <title>Live Whamm</title>
            </head>
            <body>
            <div id="main-body"></div>
            </body>
            <script> 
            </script>
            </html>
        `

        // Post message to webview so that it can render the file
        this.webviewPanel.webview.postMessage({
                command: 'init-data',
                show_wizard: this.fileName === undefined,
                wat_content: this.model.valid_wat_content,
                file_name: this.fileName
        });

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
                }
            }
        )
    }

}