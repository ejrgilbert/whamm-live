import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext';

export class WhammWebviewPanel{

    fileName: string | undefined;
    webviewPanel: vscode.WebviewPanel;

    static number_of_webviews: number;
    static webviews: WhammWebviewPanel[] = [];

    constructor(fileName: string | undefined){
        this.fileName = fileName;
        
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
    loadHTML(){
        const css_src_1 = this.webviewPanel.webview.asWebviewUri(
            vscode.Uri.joinPath(ExtensionContext.context.extensionUri, 'media', 'vscode.css'));

        const css_src_2 = this.webviewPanel.webview.asWebviewUri(
            vscode.Uri.joinPath(ExtensionContext.context.extensionUri, 'media', 'reset.css'));
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
                <title>Live Whamm</title>
            </head>
            <body>
            <div id="main-body"></div>
            <h1>Hi ${this.fileName} </h1>
            </body>
            <script> 
            </script>
            </html>
        `
    }

}