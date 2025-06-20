import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';

export class WhammWebviewPanel{

    fileName: string | undefined;
    webviewPanel: vscode.WebviewPanel;
    contents: Uint8Array<ArrayBuffer> | undefined;
    string_contents: string | undefined;
    is_wasm: boolean;

    static number_of_webviews: number;
    static webviews: WhammWebviewPanel[] = [];

    constructor(fileName: string | undefined){
        this.fileName = fileName;
        this.contents, this.string_contents = undefined;
        this.is_wasm = this.fileName?.endsWith(".wasm") || false;

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
        })
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

}