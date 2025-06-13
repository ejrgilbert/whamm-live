import * as vscode from 'vscode';

// Helper functions for sidebar provider for user interace event handling

export async function helper_open_whamm_file(): Promise<boolean> {
    const fileURI = await vscode.window.showOpenDialog({

        canSelectMany: false,
        openLabel: 'Open Whamm file',
        filters: {
            'Whamm files': ['mm'],}})
    
    if (fileURI && fileURI[0]) {

        let filePath = vscode.Uri.file(fileURI[0].fsPath);
        
        let document = await vscode.workspace.openTextDocument(filePath)
        vscode.window.showTextDocument(document, vscode.ViewColumn.Active);
        return true;

    } else 
        return false;
}
