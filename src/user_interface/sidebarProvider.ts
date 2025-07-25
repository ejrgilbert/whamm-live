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
        SidebarProvider.create_status_bar_command_buttons(context);
    }

    static create_status_bar_command_buttons(context: vscode.ExtensionContext){
        const create_status_bar_command_button = (information: status_bar_information)=>{

            // Create status bar item to display on the bottom
            let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 50);
            statusBarItem.tooltip = information.tooltip;
            statusBarItem.text = information.text;
            statusBarItem.command =information.command;
            for (let fileType of information.fileTypes){
                if (vscode.window.activeTextEditor?.document?.fileName.endsWith(fileType))
                    { statusBarItem.show(); break;}
            }
            context.subscriptions.push(statusBarItem);

            // Show or hide depending on active editor
            vscode.window.onDidChangeActiveTextEditor(editor => {
                for (let fileType of information.fileTypes){
                    if (vscode.window.activeTextEditor?.document?.fileName.endsWith(fileType))
                        { statusBarItem.show(); return;}
                }
                statusBarItem.hide();
                }, null, context.subscriptions);
        }

        type status_bar_information = {
            tooltip: string,
            text: string,
            command: string,
            fileTypes: string[],
        }

        const information_whamm : status_bar_information = {
            tooltip: "Make this current Whamm file active for Live-Whamm",
            text: "[Live Whamm] Select Whamm(.mm) file",
            command: "live-whamm:select-whamm-file",
            fileTypes: [".mm"]
        }

        const information_wat_wasm = {
            tooltip: "Make this current .wat/.wasm file active for Live-Whamm",
            text: "[Live Whamm] Select .wat/.wasm file",
            command: "live-whamm:select-wasm-file",
            fileTypes: [".wat", ".wasm"]
        }

        create_status_bar_command_button(information_whamm);
        create_status_bar_command_button(information_wat_wasm);
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
        Helper_sidebar_provider.helper_reset_sidebar_webview_state();

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
            if (webviewView.visible) Helper_sidebar_provider.helper_restore_sidebar_webview_state();
        })
    }

    // Listeners to handle messages from .svelte files
    private _addListeners(webviewView: vscode.WebviewView){

        // Setup listeners
        webviewView.webview.onDidReceiveMessage(
        async (message) =>{
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
                case "restart-live-whamm":
                    await Helper_sidebar_provider.restart_extension();
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
        const css_src_3 = webviewView.webview.asWebviewUri(
            vscode.Uri.joinPath(this.extension_uri, 'media', 'whamm_title.css'));
        
        const script_src = webviewView.webview.asWebviewUri(
            vscode.Uri.joinPath(this.extension_uri, 'svelte', 'dist', 'sidebar.js'));

        return `
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href=${css_src_1}>
                <link rel="stylesheet" href=${css_src_2}>
                <link rel="stylesheet" href=${css_src_3}>
                <script>
                    const vscode = acquireVsCodeApi();
                </script>
                <script type="module" crossorigin src=${script_src}></script>
                <title>Live Whamm</title>
            </head>
            <body>

            <div class="whamm-title-container">
            <div id="whamm-logo">
                <img id="whamm" src=${img_src} alt="whamm" />
            </div>
            <div id="whamm-title">Live Whamm</div>
            </div>


            <div id="main-body"></div>
            </body>
            <script> 
            </script>
            </html>
        `
    }

}