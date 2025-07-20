import * as vscode from 'vscode';
import { isExtensionActive } from './listenerHelper';
import { ExtensionContext } from '../extensionContext';
import { APIModel} from '../model/model';
import { WhammWebviewPanel } from '../user_interface/webviewPanel';
import { Node } from '../model/utils/cell';
import { LineHighlighterDecoration } from './lineHighlighterDecoration';
import { highlights_info, inj_circle_highlights_info } from '../model/types';
import { Types } from '../whammServer';

export function shouldUpdateView():boolean{
    // shouldUpdateModel also works here because the extension will be active
    // and the user would be on the active whamm file
    // However, shouldUpdateModel is not used to avoid confusion
    if (isExtensionActive() && !APIModel.whamm_file_changing){

        let whamm_file_path : string | undefined = ExtensionContext.context.workspaceState.get('whamm-file');
        let editor = vscode.window.activeTextEditor;
        if (editor && editor?.document.uri.fsPath === whamm_file_path){
			// clear out whamm highlights
			LineHighlighterDecoration.clear_all_decorations(vscode.window.activeTextEditor);

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
    let editor = vscode.window.activeTextEditor;
    if (editor){
        let cursor = editor.selection.active
        let line = cursor.line;
        let column = cursor.character;

        let webview_index = 0;
        for (let webview of WhammWebviewPanel.webviews){

            // No need to perform highlighting if api is out of date 
            // or the code mirror code isn't updated yet!
            if (webview.model.__api_response_out_of_date || (!webview.model.codemirror_code_updated) || (webview.model.whamm_live_response.is_err)) continue;

            // No need to perform highlighting if the jagged array doesn't have any contents for that location
            let injections = webview.model.jagged_array[line][column];
            if (!injections) continue;
            console.log(injections);

            let color_index = 0;
            let wasm_line_highlight_data: highlights_info = {};
            let inj_circle_highlight_data: inj_circle_highlights_info = {};
            let all_wat_lines: number[] = []

            // Nodes are sorted from biggest span to least span
            let current_node : Node | null= injections.head;
            while (current_node != null){

                let whamm_span = current_node.whamm_span;
                if (whamm_span){
                    // highlight the span with color at `color_index`
                    let color = LineHighlighterDecoration.highlightColors[color_index];

                    /**
                     * @todo: Do best effort highlighting:
                     */
                    LineHighlighterDecoration.clear_whamm_decorations(editor);
                    LineHighlighterDecoration.highlight_whamm_file(whamm_span, color);

                    // Save wat line and color information for every value in the node
                    LineHighlighterDecoration.store_line_highlight_data(wasm_line_highlight_data, inj_circle_highlight_data, all_wat_lines, current_node.values, color_index);
                    color_index = (color_index+1) % LineHighlighterDecoration.highlightColors.length;
                }
                // Traverse to the next node
                current_node = current_node.next;
            }

            // send wasm side highlight information to the webview
            LineHighlighterDecoration.highlight_wasm_webview_lines(webview, wasm_line_highlight_data, inj_circle_highlight_data, all_wat_lines.sort());
            webview_index++;
        }
    }
}