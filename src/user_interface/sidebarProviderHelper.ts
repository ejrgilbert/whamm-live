// Helper functions for sidebar provider for user interace event handling
import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext'; 

// Open whamm file using file dialog and VS Code API
// Returns true if whamm file opens, false otherwise
export async function helper_open_whamm_file(): Promise<boolean> {
    
    // open file dialog and only allow user to select .mm files
    const fileURI = await vscode.window.showOpenDialog({

        canSelectMany: false,
        openLabel: 'Open Whamm file',
        filters: {
            'Whamm files': ['*\.mm'],}})
    
    if (fileURI && fileURI[0]) {
        let filePath = vscode.Uri.file(fileURI[0].fsPath);
        return helper_show_whamm_file(filePath);

    } else 
        return false;
}


async function helper_show_whamm_file(filePath: vscode.Uri) : Promise<boolean>{
        
        // Open and show the text document
        let document = await vscode.workspace.openTextDocument(filePath)
        vscode.window.showTextDocument(document, {
                                preview: false,         // open a new tab
                                preserveFocus: false,   // bring the new tab into focus
                            });

        
        // Update workspace state
        helper_update_whamm_workspace_state(filePath.fsPath, true);

        return true;
}

function helper_update_whamm_workspace_state(whamm_file: string, whamm_file_active: boolean){
        ExtensionContext.context.workspaceState.update('whamm-file',
            whamm_file
        )
        ExtensionContext.context.workspaceState.update('whamm-file-active',
            whamm_file_active
        )

}