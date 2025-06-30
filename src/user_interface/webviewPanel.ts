import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';
import { handleDocumentChanges, shouldUpdateModel } from '../extensionListeners/documentChangesListener';

export class WhammWebviewPanel{

    fileName: string | undefined;
    webviewPanel!: vscode.WebviewPanel;
    contents: Uint8Array<ArrayBuffer> | undefined;
    string_contents: string | undefined;
    is_wasm: boolean;

    // content sent back from svelte frontend
    // will be null if wizard option chosen
    valid_wat_content!: string | null;
    
    // Mapping from whamm script line number to
    // a tuple of injected content and lines in webview where it is injected
    line_to_probe_mapping: Map<number, [string, number[]]>

    static number_of_webviews: number = 0;
    static webviews: WhammWebviewPanel[] = [];

    constructor(fileName: string | undefined){
        this.fileName = fileName;
        this.contents, this.string_contents = undefined;
        this.is_wasm = this.fileName?.endsWith(".wasm") || false;
        this.line_to_probe_mapping = new Map();
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
        this.valid_wat_content = await this.getWat();

        // Handle disposing of the panel afterwards
        this.webviewPanel.onDidDispose(()=>{
                WhammWebviewPanel.removePanel(this);
        })
    }

    // Static methods
    private static addPanel(webview: WhammWebviewPanel){
        WhammWebviewPanel.number_of_webviews++;
        WhammWebviewPanel.webviews.push(webview);
        handleDocumentChanges();
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
        if (this.fileName){
            if (this.is_wasm)
                this.contents = await this.getFileContents();
            else 
                this.string_contents = await this.getFileStringContents();
        }

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
                wasm_file_contents: this.contents,
                wat_file_contents: this.string_contents,
                is_wasm: this.is_wasm,
                file_name: this.fileName
        });
    }

    // gets the bytes from the selected .wasm file
    private async getFileContents(): Promise<Uint8Array>{
        var fileBytes = new Uint8Array();

        if (this.fileName){
                const fileUri = vscode.Uri.file(this.fileName);
                let fileBytes_: Uint8Array<ArrayBufferLike> = await vscode.workspace.fs.readFile(fileUri);
                fileBytes = new Uint8Array(fileBytes_);
        }

        return fileBytes;
    }

    private async getFileStringContents(): Promise<string>{
        var text ="";
        if (this.fileName){
            const fileUri = vscode.Uri.file(this.fileName);
            let fileBytes_: Uint8Array<ArrayBufferLike> = await vscode.workspace.fs.readFile(fileUri);
            text = new TextDecoder().decode(fileBytes_);
        }
        return text;
    }

    private async getWat(): Promise<string | null>{
        let wat = null;
        if (this.fileName){

		    let file_content = await vscode.workspace.fs.readFile(vscode.Uri.file(this.fileName));
            if (this.is_wasm){
                wat = ExtensionContext.api.wasm2wat(file_content);
            } else
                wat = ExtensionContext.api.wat2wat(
                    new TextDecoder('utf-8').decode(file_content));
        }
        return wat;
    }
}