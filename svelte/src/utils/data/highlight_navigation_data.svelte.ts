import { EditorView } from "codemirror";
import { highlight_data } from "./highlight_data.svelte";
import { config } from "./api_response.svelte";

export const highlight_navigation_data = $state({
    cursor_highlight_button_clicked : false,
    // index for the current cursor highlight
    current_index : 0
});

export function reset_highlight_navigation_data(node: HTMLDivElement){
    highlight_navigation_data.cursor_highlight_button_clicked = false;
    highlight_navigation_data.current_index = 0;
}

export function mod (n: number, m: number): number{
    return ((n % m) + m) % m;
}

// Cursor highlight related functions
export function scrollToAnotherHighlight(next: boolean, view: EditorView){
    let appropriate_array = (config.show_wizard) ? highlight_data.injection_start_wat_lines : highlight_data.all_wat_lines;
    if (!highlight_navigation_data.cursor_highlight_button_clicked){
        highlight_navigation_data.cursor_highlight_button_clicked = true;
    } else{
        // change index for next time
        // ((-1) % 5) = -1 in js so need to do this LMAO
        highlight_navigation_data.current_index = mod((highlight_navigation_data.current_index + ((next) ? 1 : -1)), appropriate_array.length);
    }
    let line_number = appropriate_array[highlight_navigation_data.current_index];
    const line = view.state.doc.line(line_number);
    view.dispatch({
        effects: EditorView.scrollIntoView(line.from, {
            y: "center" // options: "start", "center", "end", or "nearest"
        }
    )});
}
