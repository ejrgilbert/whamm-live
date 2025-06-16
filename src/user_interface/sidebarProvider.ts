import * as vscode from 'vscode';
import {Helper_sidebar_provider} from './sidebarProviderHelper';

// Need to implement webview provider with `resolveWebviewView` method to show any webview in the sidebar
export class SidebarProvider implements vscode.WebviewViewProvider{
    id: string;
    extension_uri : vscode.Uri;
    context : vscode.ExtensionContext;

    constructor(id: string, context : vscode.ExtensionContext){
        this.id = id;
        this.extension_uri = context.extensionUri;
        this.context = context;
        SidebarProvider.create_status_bar_command_button(context);
    }

    static create_status_bar_command_button(context: vscode.ExtensionContext){
        
        // Create status bar item to display on the bottom
        let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 50);
        statusBarItem.tooltip = "Make this current Whamm file active for Live-Whamm"
        statusBarItem.text = "[Live Whamm] Select Whamm(.mm) file";
        statusBarItem.command = "live-whamm:select-wasm-file";
        if (vscode.window.activeTextEditor?.document?.fileName.endsWith(".mm"))
                statusBarItem.show();

        context.subscriptions.push(statusBarItem);

        // Show or hide depending on active editor
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor?.document?.fileName.endsWith(".mm")) {
                statusBarItem.show();
            } else {
                statusBarItem.hide();
            }
            }, null, context.subscriptions);
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
        
        Helper_sidebar_provider.webview = webviewView.webview;

        // Enable JS to run and set '/media' as path to load local content from
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this.extension_uri, 'media'),
                                vscode.Uri.joinPath(this.extension_uri, 'svelte', 'dist') ],
        }

        this._addListeners(webviewView);

        webviewView.webview.html = this._get_html_content(webviewView);

        // restore any information when webview becomes visible
        webviewView.onDidChangeVisibility(()=>{
            if (webviewView.visible) Helper_sidebar_provider.helper_restore_sidebar_webview_state(webviewView.webview);
        })
    }

    // Listeners to handle messages from .svelte files
    private _addListeners(webviewView: vscode.WebviewView){

        // Setup listeners
        webviewView.webview.onDidReceiveMessage(
        (message) =>{
             switch (message.command) {
            case 'open-whamm-file':
                
                // Will open the file dialog, if user selects a file, opens the file
                // and saves the file info in workspace state with the key 'whamm-file'
                // returns true if user selects a whamm file, false otherwise
                // does nothing otherwise
                const success = Helper_sidebar_provider.helper_open_whamm_file();
                if (!success) vscode.window.showErrorMessage("Could not open .mm file");
                return;
            case 'open-wat/wasm-file':{
                const success = Helper_sidebar_provider.helper_open_webview(message.wasm_wizard_engine);
                if (!success) vscode.window.showErrorMessage("Could not open webview");
            }
                return;
          }},
          undefined,
          this.context.subscriptions,
        );
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