import * as vscode from 'vscode';

// Need to implement webview provider with `resolveWebviewView` method to show any webview in the sidebar
export class SidebarProvider implements vscode.WebviewViewProvider{
    extension_uri : vscode.Uri;

    constructor(uri : vscode.Uri){
        this.extension_uri = uri;
    }

    // Main method that renders the webview(html) for the sidebar when the user clicks on the 'live-whamm' icon
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, token: vscode.CancellationToken): Thenable<void> | void {
        throw new Error('Method not implemented.');
    }

    // Create a new SidebarProvider instance and register a webview view provider
    static createAndRegisterWebViewProvider(context: vscode.ExtensionContext, id: string){
        const sidebarProvider = new SidebarProvider(context.extensionUri);
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(
                id,
                sidebarProvider
            )
        )
    }
}