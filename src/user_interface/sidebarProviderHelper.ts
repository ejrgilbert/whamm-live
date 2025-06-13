// Helper functions for sidebar provider for user interace event handling
import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext'; 

// Open whamm file using file dialog and VS Code API
// Returns true if whamm file opens, false otherwise
export async function helper_open_whamm_file(webview: vscode.Webview): Promise<boolean> {
    
    // open file dialog and only allow user to select .mm files
    const fileURI = await vscode.window.showOpenDialog({

        canSelectMany: false,
        openLabel: 'Open Whamm file',
        filters: {
            'Whamm files': ['*\.mm'],}})
    
    if (fileURI && fileURI[0]) {
        let filePath = vscode.Uri.file(fileURI[0].fsPath);
        return helper_show_whamm_file(filePath, webview);

    } else 
        return false;
}


async function helper_show_whamm_file(filePath: vscode.Uri, webview: vscode.Webview) : Promise<boolean>{
        
        // Open and show the text document
        let document = await vscode.workspace.openTextDocument(filePath)
        vscode.window.showTextDocument(document, {
                                preview: false,         // open a new tab
                                preserveFocus: false,   // bring the new tab into focus
                            });

        
        // Update workspace state
        helper_update_whamm_workspace_state(filePath.fsPath, true, webview);

        return true;
}

function helper_update_whamm_workspace_state(whamm_file: string | undefined, whamm_file_active: boolean, webview: vscode.Webview){
        ExtensionContext.context.workspaceState.update('whamm-file',
            whamm_file
        );
        ExtensionContext.context.workspaceState.update('whamm-file-active',
            whamm_file_active
        );


        // let the WhammFileSidebar.svelte file know about the workspace update changes so that the html can update accordingly
        if (whamm_file) {
            let whamm_file_list : string[] = whamm_file.split('/');
            whamm_file = whamm_file_list[whamm_file_list.length - 1];
        }
        webview.postMessage({
            command: 'workspace-whamm-update',
            whamm_file: whamm_file,
            whamm_file_active: whamm_file_active
        });
}

export function helper_restore_sidebar_webview_state(webview: vscode.Webview){
    helper_update_whamm_workspace_state(
        ExtensionContext.context.workspaceState.get('whamm-file'),
        ExtensionContext.context.workspaceState.get('whamm-file-active') || false,
        webview
    )

}