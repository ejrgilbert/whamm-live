// Helper functions for sidebar provider for user interace event handling
import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext'; 
import { WhammWebviewPanel } from './webviewPanel'; 

// Open whamm file using file dialog and VS Code API
// Returns true if whamm file opens, false otherwise
export class Helper_sidebar_provider{
    static webview: vscode.Webview;
    static file_listener: vscode.Disposable;

    static async helper_open_whamm_file(): Promise<boolean> {
        
        // open file dialog and only allow user to select .mm files
        const fileURI = await vscode.window.showOpenDialog({

            canSelectMany: false,
            openLabel: 'Open Whamm file',
            filters: {
                'Whamm files': ['*\.mm'],}})
        
        if (fileURI && fileURI[0]) {
            let filePath = vscode.Uri.file(fileURI[0].fsPath);
            return Helper_sidebar_provider.helper_show_whamm_file(filePath);

        } else 
            return false;
    }

    static async helper_open_webview(wasm_wizard_engine: boolean): Promise<boolean> {
        
        if (wasm_wizard_engine){
            Helper_sidebar_provider.helper_show_wasm_file(undefined);
        } else {

            const fileURI = await vscode.window.showOpenDialog({

                canSelectMany: false,
                openLabel: 'Open wat/wasm file',
                filters: {
                    'Wat/Wasm files': ['.*\.wat', '.*\.wasm'],}})
            
            if (fileURI && fileURI[0]) {
                Helper_sidebar_provider.helper_show_wasm_file(fileURI[0].fsPath);
            } else 
                return false;
    }
        return true;
    }

    static helper_show_wasm_file(path: string | undefined){
        let panel = new WhammWebviewPanel(path);
        panel.loadHTML();
    }

    static async helper_show_whamm_file(filePath: vscode.Uri) : Promise<boolean>{
            
            // Open and show the text document
            let document = await vscode.workspace.openTextDocument(filePath)
            vscode.window.showTextDocument(document, {
                                    preview: false,         // open a new tab
                                    preserveFocus: false,   // bring the new tab into focus
                                });
            
            // Update workspace state
            Helper_sidebar_provider.helper_update_whamm_workspace_state(filePath.fsPath);
            
            // When text document is no longer is memory
            vscode.workspace.onDidCloseTextDocument((textDocument)=>{
                if (textDocument.uri.fsPath === filePath.fsPath === ExtensionContext.context.workspaceState.get('whamm-file')){
                    Helper_sidebar_provider.helper_update_whamm_workspace_state(undefined);
                }
            })

            return true;
    }

    static helper_update_whamm_workspace_state(whamm_file: string | undefined){
            ExtensionContext.context.workspaceState.update('whamm-file',
                whamm_file
            );

            // let the WhammFileSidebar.svelte file know about the workspace update changes so that the html can update accordingly
            if (whamm_file) {
                let whamm_file_list : string[] = whamm_file.split('/');
                whamm_file = whamm_file_list[whamm_file_list.length - 1];
            }
            Helper_sidebar_provider.webview.postMessage({
                command: 'workspace-whamm-update',
                whamm_file: whamm_file,
            });
    }

    static helper_reset_sidebar_webview_state(){
        Helper_sidebar_provider.helper_update_whamm_workspace_state(
            undefined
        )

    }

    static helper_restore_sidebar_webview_state(){
        Helper_sidebar_provider.helper_update_whamm_workspace_state(
            ExtensionContext.context.workspaceState.get('whamm-file'),
        )

    }
}