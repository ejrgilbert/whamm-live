import * as vscode from 'vscode';
import { isExtensionActive, DiagnosticCollection} from './listenerHelper';
import { ExtensionContext } from '../extensionContext';
import { Model } from '../model/model';
import { sample_whamm_api_error_response, sample_whamm_api_response } from '../model/sampleAPIData';
import { handleCursorChange } from './cursorChangesListener';
import { WhammWebviewPanel } from '../user_interface/webviewPanel';
import { WhammResponse } from '../model/types';

export function shouldUpdateModel(): boolean{
    // The extension should be active and we must be making changes 
    // to the selected whamm file for us to update the model
    return isExtensionActive()
        && ExtensionContext.context.workspaceState.get
            ('whamm-file') == vscode.window.activeTextEditor?.document.uri.fsPath;
}

// Is only called when we NEED to update the model
export function handleDocumentChanges(){
    Model.whamm_file_changing = true;
    // TODO [ fetch from the actual WHAMM API ]
    Model.response = sample_whamm_api_error_response;
    update_webview_model(Model.response);
    DiagnosticCollection.collection.clear();
    
    // If there is an error, we want to act like a LSP
    // by displaying the red swiggly lines in the appropriate source code
    if (Model.response.error !== undefined){
        displayErrorInWhammFile();
    } else{
        // Only update the model, no need to update the view
        Model.no_error_response = Model.response;
    }
    Model.whamm_file_changing = false;
}

function displayErrorInWhammFile(){

    let path: string | undefined = ExtensionContext.context.workspaceState.get('whamm-file');
    if (path !== undefined){
        let textEditor = vscode.Uri.file(path);
        let diagnostics: vscode.Diagnostic[] = [];

        // For each error from our API response, create a new diagnostic
        // based on the line and column information
        Model.response.error?.forEach(error =>{
            let script_start = error.err_loc?.script_start;
            let script_end = error.err_loc?.script_end;

            if (script_start && script_end){
                const start_pos = new vscode.Position(script_start.l, script_start.c);
                const end_pos = new vscode.Position(script_end.l, script_end.c);
                const range = new vscode.Range(start_pos, end_pos);
                
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    error.msg,
                    vscode.DiagnosticSeverity.Error
                ));
            }
        })
        DiagnosticCollection.collection.set(textEditor, diagnostics);
    }
}

// Update the model for the webviews
function update_webview_model(response: WhammResponse){
    // TODO
    // reset if error
    for (let webview of WhammWebviewPanel.webviews){
        webview.line_to_probe_mapping.set(8, ["i32.const 10", [1,5]]);
        webview.line_to_probe_mapping.set(0, ["i32.const 10", [3,6]]);
    }
}