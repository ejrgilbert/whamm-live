import * as vscode from 'vscode';
import { isExtensionActive, DiagnosticCollection} from './listenerHelper';
import { ExtensionContext } from '../extensionContext';
import { APIModel } from '../model/model';
import { WhammWebviewPanel } from '../user_interface/webviewPanel';
import { Types } from '../whammServer';
import { ModelHelper } from '../model/utils/model_helper';
import { Helper_sidebar_provider } from '../user_interface/sidebarProviderHelper';

export function shouldUpdateModel(): boolean{
    // The extension should be active and we must be making changes 
    // to the selected whamm file for us to update the model
    return isExtensionActive()
        && ExtensionContext.context.workspaceState.get
            ('whamm-file') == vscode.window.activeTextEditor?.document.uri.fsPath;
}

// Is only called when we NEED to update the model
export async function handleDocumentChanges(){
    APIModel.whamm_file_changing = true;
    APIModel.set_api_out_of_date(true);

    let whamm_errors : Types.WhammApiError[]= [];
    // It won't be null if this function is called
    let whamm_contents = await Helper_sidebar_provider.helper_get_whamm_file_contents();
    if (!whamm_contents) throw new Error("This function cannot be called without a whamm file");
    for (let webview of WhammWebviewPanel.webviews){
        if (!webview.model.api_response_setup_completed) continue;

        let success = await webview.model.update();
        if (!success) {
            vscode.window.showInformationMessage("Error: Failed to update the model");
            webview.webviewPanel.dispose();
            return;
        }
        if (webview.model.whamm_live_response.is_err) {
            // No need to call the API for other webviews since whamm file has an error
            whamm_errors = webview.model.whamm_live_response.whamm_errors;
            break;
        } else{
            webview.model.api_response_out_of_date = false;
        }
    }

    // Show and update API responses if any (because one error response means
    // all the other wasm targets would also have errors since error is on the whamm side)
    show_and_handle_error_response(whamm_contents, whamm_errors);
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

// Handle the error response from the WHAMM api
// it doesn't make sense to keep calling the whamm API when we get **one** error response
// since the errors are for the whamm file
// so instead, we just modify the values for the other wasm webviews and notify the rust side about the new whamm contents
export function show_and_handle_error_response(file_contents: string, whamm_errors: Types.WhammApiError[]){
    DiagnosticCollection.collection.clear();
    // If there is an error, we want to act like a LSP
    // by displaying the red swiggly lines in the appropriate source code
    if (whamm_errors.length > 0){
        // Store the new error response for all the webviews
        for (let webview of WhammWebviewPanel.webviews){
            ModelHelper.handle_error_response(webview.model, whamm_errors);
            if (webview.fileName) ExtensionContext.api.updateWhamm(file_contents, webview.fileName);
        }
        
        APIModel.set_api_out_of_date(false);
        displayErrorInWhammFile(whamm_errors);
    }
}