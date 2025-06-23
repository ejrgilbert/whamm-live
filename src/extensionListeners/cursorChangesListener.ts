import * as vscode from 'vscode';
import { isExtensionActive } from './listenerHelper';
import { ExtensionContext } from '../extensionContext';
import { Model } from '../model/model';
import { WhammWebviewPanel } from '../user_interface/webviewPanel';

export function shouldUpdateView():boolean{
    // shouldUpdateModel also works here because the extension will be active
    // and the user would be on the active whamm file
    // However, shouldUpdateModel is not used to avoid confusion
    return (!Model.whamm_file_changing)
        && isExtensionActive()
        && ExtensionContext.context.workspaceState.get
            ('whamm-file') == vscode.window.activeTextEditor?.document.uri.fsPath;
}

export function handleCursorChange(){
    if (Model.whamm_file_changing) return;
    // Get the line number from the active text editor which will be our currently selected whamm file
    let cursor = vscode.window.activeTextEditor?.selection.active
    if (cursor){
        let line = cursor.line;
        let column = cursor.character;
        
        // send data to highlight in frontend
        for (let webview of WhammWebviewPanel.webviews){
            let probe_info = webview.line_to_probe_mapping.get(line);
            webview.webviewPanel.webview.postMessage({
                command: 'highlight',
                data: probe_info,
            })
        }
    }
}