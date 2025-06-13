import * as vscode from 'vscode';

// Need to implement webview provider with `resolveWebviewView` method to show any webview in the sidebar
export class SidebarProvider implements vscode.WebviewViewProvider{
    id: string;
    extension_uri : vscode.Uri;
    context : vscode.ExtensionContext;

    constructor(id: string, context : vscode.ExtensionContext){
        this.id = id;
        this.extension_uri = context.extensionUri;
        this.context = context;
    }

    // Static method(s):

    // Create a new SidebarProvider instance and register a webview view provider
    static createAndRegisterWebViewProvider(context: vscode.ExtensionContext, id: string){
        const sidebarProvider = new SidebarProvider(id, context);
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(
                id,
                sidebarProvider
            )
        )
    }
    
    // Instance methods

    // Main method that renders the webview(html) for the sidebar when the user clicks on the 'live-whamm' icon
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, token: vscode.CancellationToken): Thenable<void> | void {
        
        // Enable JS to run and set '/media' as path to load local content from
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this.extension_uri, 'media'),
                                vscode.Uri.joinPath(this.extension_uri, 'svelte', 'dist') ]
        }

        webviewView.webview.onDidReceiveMessage(
        (message) =>{
             switch (message.command) {
            case 'svelte':
              vscode.window.showInformationMessage(message.command);
              return;
          }},
          undefined,
          this.context.subscriptions,
        );

        webviewView.webview.html = this._get_html_content(webviewView);
    }

    private _get_html_content(webviewView: vscode.WebviewView) : string {

        const img_src = webviewView.webview.asWebviewUri(
            vscode.Uri.joinPath(this.extension_uri, 'media', 'whamm-logo.png'));

        const css_src_1 = webviewView.webview.asWebviewUri(
            vscode.Uri.joinPath(this.extension_uri, 'media', 'vscode.css'));

        const css_src_2 = webviewView.webview.asWebviewUri(
            vscode.Uri.joinPath(this.extension_uri, 'media', 'reset.css'));
        
        const script_src = webviewView.webview.asWebviewUri(
            vscode.Uri.joinPath(this.extension_uri, 'svelte', 'dist', 'sidebar.js'));

        return `
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href=${css_src_1}>
                <link rel="stylesheet" href=${css_src_2}>
                <style>
                    img:hover {
                    animation: shake 0.5s;
                    animation-iteration-count: infinite;
                    }

                    @keyframes shake {
                    0% { transform: translate(1px, 1px) rotate(0deg); }
                    10% { transform: translate(-1px, -2px) rotate(-1deg); }
                    20% { transform: translate(-3px, 0px) rotate(1deg); }
                    30% { transform: translate(3px, 2px) rotate(0deg); }
                    40% { transform: translate(1px, -1px) rotate(1deg); }
                    50% { transform: translate(-1px, 2px) rotate(-1deg); }
                    60% { transform: translate(-3px, 1px) rotate(0deg); }
                    70% { transform: translate(3px, 1px) rotate(-1deg); }
                    80% { transform: translate(-1px, -1px) rotate(1deg); }
                    90% { transform: translate(1px, 2px) rotate(0deg); }
                    100% { transform: translate(1px, -2px) rotate(-1deg); }
                    }
                </style>
                <script>
                    const vscode = acquireVsCodeApi();
                    console.log(vscode);
                </script>
                <script type="module" crossorigin src=${script_src}></script>
                <title>Live Whamm</title>
            </head>
            <body>
            <img id="whamm" src=${img_src} alt="whamm">
            <div id="main-body"></div>
            </body>
            <script> 
            </script>
            </html>
        `
    }

}