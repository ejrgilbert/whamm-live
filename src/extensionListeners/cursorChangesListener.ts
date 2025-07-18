import * as vscode from 'vscode';
import { isExtensionActive } from './listenerHelper';
import { ExtensionContext } from '../extensionContext';
import { APIModel} from '../model/model';
import { WhammWebviewPanel } from '../user_interface/webviewPanel';
import { Node } from '../model/utils/cell';
import { LineHighlighterDecoration } from './lineHighlighterDecoration';

export function shouldUpdateView():boolean{
    // shouldUpdateModel also works here because the extension will be active
    // and the user would be on the active whamm file
    // However, shouldUpdateModel is not used to avoid confusion
    if (isExtensionActive() && !APIModel.whamm_file_changing){

        let whamm_file_path : string | undefined = ExtensionContext.context.workspaceState.get('whamm-file');
        let editor = vscode.window.activeTextEditor;
        if (editor && editor?.document.uri.fsPath === whamm_file_path){
            var file_contents = editor.document.getText();
            if (file_contents === APIModel.whamm_cached_content){
                return true;
            }
        } 
    }
    return false;
}

export function handleCursorChange(){
    if (APIModel.whamm_file_changing) return;
    // Get the line number from the active text editor which will be our currently selected whamm file
    let cursor = vscode.window.activeTextEditor?.selection.active
    if (cursor){
        let line = cursor.line;
        let column = cursor.character;

        for (let webview of WhammWebviewPanel.webviews){

            // No need to perform highlighting if api is out of date 
            // or the code mirror code isn't updated yet!
            if (webview.model.__api_response_out_of_date || (!webview.model.codemirror_code_updated)) continue;

            // No need to perform highlighting if the jagged array doesn't have any contents for that location
            let injections = webview.model.jagged_array[line][column];
            if (!injections) continue;

            // Nodes are sorted from biggest span to least span
            let current_node : Node | null= injections.head;
            let color_index = 0;
            while (current_node != null){

                let whamm_span = current_node.whamm_span;
                if (whamm_span){
                    // highlight the span with color at `color_index`
                    LineHighlighterDecoration.highlight_whamm_file(whamm_span, color_index);
                }
                // Traverse to the next node
                current_node = current_node.next;
                color_index = (color_index+1) % LineHighlighterDecoration.highlightColors.length;
            }
        }
    }
}