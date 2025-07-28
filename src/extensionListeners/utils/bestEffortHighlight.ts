import { WhammLiveInjection } from "../../model/types";
import { Cell, Node } from "../../model/utils/cell";
import { ModelHelper } from "../../model/utils/model_helper";
import { WhammWebviewPanel } from "../../user_interface/webviewPanel";

export class BestEffortHighlight{

    // sort all the whamm live injections based on their whamm span value based on the line, col value
    // sorts from biggest span size to smallest span size
    static sort_all_whamm_live_injections(line: number, col: number): WhammLiveInjection[] {
        let sorted_injections: [WhammLiveInjection, (Cell|null)[][]][]= [];

        for (let webview of WhammWebviewPanel.webviews){
            let cell = webview.model.jagged_array[line][col];
            if (!cell) continue;

            let current_node : Node | null = cell.head;
            while (current_node != null){
                for (let value of current_node.values){
                    sorted_injections.push([value, webview.model.jagged_array]);
                }
                current_node = current_node.next;
            }
        }
        sorted_injections.sort(
            (b,a)=>ModelHelper.calculate_span_size(a[0].whamm_span, a[1])
                - ModelHelper.calculate_span_size(b[0].whamm_span, b[1]));
        return sorted_injections.map((a)=>a[0]);
    }
}