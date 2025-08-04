import { EditorView } from "codemirror";
import { highlight_data } from "./highlight_data.svelte";

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
    if (!highlight_navigation_data.cursor_highlight_button_clicked){
        highlight_navigation_data.cursor_highlight_button_clicked = true;
    } else{
        // change index for next time
        // ((-1) % 5) = -1 in js so need to do this LMAO
        highlight_navigation_data.current_index = mod((highlight_navigation_data.current_index + ((next) ? 1 : -1)), highlight_data.all_wat_lines.length);
    }
    let line_number = highlight_data.all_wat_lines[highlight_navigation_data.current_index];
    const line = view.state.doc.line(line_number);
    view.dispatch({
        effects: EditorView.scrollIntoView(line.from, {
            y: "center" // options: "start", "center", "end", or "nearest"
        }
    )});
}
