import * as vscode from 'vscode';
import { isExtensionActive } from './utils/listenerHelper';
import { ExtensionContext } from '../extensionContext';
import { WasmWebviewPanel } from '../user_interface/wasmWebviewPanel';
import { Cell, Node } from '../model/utils/cell';
import { LineHighlighterDecoration } from './utils/lineHighlighterDecoration';
import { highlights_info, inj_circle_highlights_info, WhammLiveInjection } from '../model/types';
import { ModelHelper } from '../model/utils/model_helper';
import { BestEffortHighlight } from './utils/bestEffortHighlight';
import { APIModel } from '../model/api_model/model';

export function shouldUpdateView():boolean{
    // shouldUpdateModel also works here because the extension will be active
    // and the user would be on the active whamm file
    // However, shouldUpdateModel is not used to avoid confusion
    if (isExtensionActive() && !APIModel.whamm_file_changing){

        let whamm_file_path : string | undefined = ExtensionContext.context.workspaceState.get('whamm-file');
        let editor = vscode.window.activeTextEditor;
        if (editor && editor?.document.uri.fsPath === whamm_file_path){
			// clear out whamm highlights
			LineHighlighterDecoration.clear_all_decorations();

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
        // account for offset
        // VVIP: Sort all the injections and get necessary data for best effort highlighting for ALL TARGETS
        let all_injections = sort_all_whamm_live_injections(line+1, column+1);
        let null_jagged_array = ModelHelper.create_jagged_array(APIModel.whamm_cached_content);
        let best_effort_highlight_data = BestEffortHighlight.run(all_injections, null_jagged_array);

        let webview_index = 0;
        for (let webview of WasmWebviewPanel.webviews){

            // No need to perform highlighting if api is out of date 
            // or the code mirror code isn't updated yet!
            if (webview.model.__api_response_out_of_date || (!webview.model.codemirror_code_updated) || (webview.model.whamm_live_response.is_err)) continue;

            // No need to perform highlighting if the jagged array doesn't have any contents for that location
            let injections = webview.model.jagged_array[line][column];
            if (!injections) continue;

            let wasm_line_highlight_data: highlights_info = {};
            let inj_circle_highlight_data: inj_circle_highlights_info = {};
            let all_wat_lines: number[] = []

            // Nodes are sorted from biggest span to least span
            let current_node : Node | null= injections.head;
            while (current_node != null){

                let whamm_span = current_node.whamm_span;
                if (whamm_span){
                    // use the best effort highlight data
                    let color_index = best_effort_highlight_data.span_to_color_index[current_node.whamm_spansize];

                    // Save wat line and color information for every value in the node
                    LineHighlighterDecoration.store_line_highlight_data(wasm_line_highlight_data, inj_circle_highlight_data, all_wat_lines, current_node.values, color_index);
                }
                // Traverse to the next node
                current_node = current_node.next;
            }

            // send wasm side highlight information to the webview
            LineHighlighterDecoration.highlight_wasm_webview_lines(webview, wasm_line_highlight_data, inj_circle_highlight_data, all_wat_lines.sort());
            webview_index++;
        }

        // Highlight the whamm file
        LineHighlighterDecoration.clear_whamm_decorations();
        LineHighlighterDecoration.highlight_whamm_file(best_effort_highlight_data.color_index_to_span, null_jagged_array);
    }
}

// sort all the whamm live injections based on their whamm span value based on the line, col value
// sorts from biggest span size to smallest span size
// 1 based line and column
function sort_all_whamm_live_injections(line: number, col: number): WhammLiveInjection[] {
    let sorted_injections: [WhammLiveInjection, (Cell|null)[][]][]= [];

    for (let webview of WasmWebviewPanel.webviews){
        if (webview.model.__api_response_out_of_date || (!webview.model.codemirror_code_updated) || (webview.model.whamm_live_response.is_err)) continue;
        let cell = webview.model.jagged_array[line-1][col-1];
        if (!cell) continue;

        let current_node : Node | null = cell.head;
        while (current_node != null){
            for (let value of current_node.values){
                sorted_injections.push([value, webview.model.jagged_array]);
            }
            current_node = current_node.next;
        }
    }
    return sorted_injections.sort(
        (b,a)=>ModelHelper.calculate_span_size(a[0].whamm_span, a[1])
            - ModelHelper.calculate_span_size(b[0].whamm_span, b[1])).map(a=>a[0]);
}