import * as vscode from 'vscode';
import { isExtensionActive, DiagnosticCollection} from './listenerHelper';
import { ExtensionContext } from '../extensionContext';
import { APIModel } from '../model/model';
import { WhammWebviewPanel } from '../user_interface/webviewPanel';
import { Types } from '../whammServer';

export function shouldUpdateModel(): boolean{
    // The extension should be active and we must be making changes 
    // to the selected whamm file for us to update the model
    return isExtensionActive()
        && ExtensionContext.context.workspaceState.get
            ('whamm-file') == vscode.window.activeTextEditor?.document.uri.fsPath;
}

// Is only called when we NEED to update the model
export function handleDocumentChanges(){
    APIModel.whamm_file_changing = true;
    let whamm_errors : Types.WhammApiError[]= [];

    for (let webview of WhammWebviewPanel.webviews){
        if (!webview.model.api_response_setup_completed) continue;

        let success = webview.model.update();
        if (!success) {
            vscode.window.showInformationMessage("Error: Failed to update the model");
            webview.webviewPanel.dispose();
            return;
        }
        if (webview.model.whamm_live_response.is_err && whamm_errors.length == 0) {
            whamm_errors = webview.model.whamm_live_response.whamm_errors;
        }
    }

    DiagnosticCollection.collection.clear();

    // If there is an error, we want to act like a LSP
    // by displaying the red swiggly lines in the appropriate source code
    if (whamm_errors.length > 0){
        displayErrorInWhammFile(whamm_errors);
    }
    APIModel.whamm_file_changing = false;
}

function displayErrorInWhammFile(whamm_errors: Types.WhammApiError[]){

    let path: string | undefined = ExtensionContext.context.workspaceState.get('whamm-file');
    if (path !== undefined && isExtensionActive()){
        let textEditor = vscode.Uri.file(path);
        let diagnostics: vscode.Diagnostic[] = [];

        // For each error from our API response, create a new diagnostic
        // based on the line and column information
        whamm_errors.forEach(error =>{
            let line_column = error.errLoc?.lineCol;

            if (line_column){
                const start_pos = new vscode.Position(line_column.lc0.l -1, line_column.lc0.c - 1);
                const end_pos = new vscode.Position(line_column.lc1.l -1, line_column.lc1.c - 1);
                const range = new vscode.Range(start_pos, end_pos);
                
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    error.message,
                    vscode.DiagnosticSeverity.Error
                ));
            }
        })
        DiagnosticCollection.collection.set(textEditor, diagnostics);
    }
}