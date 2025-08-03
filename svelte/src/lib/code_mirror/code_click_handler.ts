import { EditorView } from "@codemirror/view";
import { api_response } from "../api_response.svelte";
import { highlight_data } from "../highlight_data.svelte";

export const code_click_handler = EditorView.domEventHandlers({

  click(event, view) {
    const target = event.target as HTMLElement;
    // Check if the click was inside the code content area
    if (!target.closest(".cm-content")) return;

    const coords = { x: event.clientX, y: event.clientY };
    const pos = view.posAtCoords(coords);
    if (pos == null) return;
    const line = view.state.doc.lineAt(pos);
    
    handle_line_click(line.number);
  }
});

function is_okay_to_send_data(): boolean{
    return api_response.codemirror_code_updated && !api_response.out_of_date && (api_response.wasm_model!= null);
}

function handle_line_click(line: number){
    // Send the line number to the extension side so that it can handle it
    if (is_okay_to_send_data()) {
        // Don't do anything if line is already highlighted or it is not an injected line
        if (highlight_data.lines[line] || (!api_response.wasm_model?.lines_injected.includes(line))) return;
        post_highlight_message(line);
    }
}

export function handle_circle_click(injection_id: number){
    // Only do if the circle hasn't already been highlighted and if we can send the data
    if (is_okay_to_send_data() && (!highlight_data.circles[injection_id])) {
        post_circle_highlight_message(injection_id);
    }
}

function post_highlight_message(line: number){
    //@ts-ignore
    vscode.postMessage({
        command: "wat-line-highlight",
        line: line
    });
}

function post_circle_highlight_message(id: number){
    //@ts-ignore
    vscode.postMessage({
        command: "wat-circle-highlight",
        id: id
    });
}
 