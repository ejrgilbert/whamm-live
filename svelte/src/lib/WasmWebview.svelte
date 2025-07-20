<script lang="ts">
  import { fade } from "svelte/transition";
  import { api_response } from "./api_response.svelte";
  import { clearBackgroundColors, setBackgroundColorForLines } from "./code_mirror/injected_line_highlight";
  import { addDanglingCircleInjections, clearInjectedCircles} from "./code_mirror/gutter_view";
  import { highlight_data } from "./highlight_data.svelte";
  import { EditorView } from "codemirror";

    // Code mirror view
    const { view } = $props();
    let cursor_highlight_button_clicked = $state(false);
    // index for the current cursor highlight
    let current_index = $state(0);

    const load_html = function(node: HTMLElement){
        if (view) document.getElementById("wasm-webview-code-editor")?.appendChild(view.dom);
    }

    function update_codemirror(){
        api_response.codemirror_code_updated = true;
        let wat_content: string = (api_response.model) ? api_response.model.injected_wat : api_response.original_wat;

        // Update codemirror content
        const transaction = view.state.update({
            changes: { from: 0, to: view.state.doc.length, insert: wat_content }
        });
        view.dispatch(transaction);
        // clear all the previously injected circles and background colors
        clearInjectedCircles(view);
        clearBackgroundColors(view);

        // Update line highlights and dangling circles injected
        if (api_response.model){
            setBackgroundColorForLines(view, api_response.model.lines_injected, "bg-injected")
            addDanglingCircleInjections(view, api_response.model);
        }

        // update the extension side about the update
        post_message_to_extension();
    }

    function post_message_to_extension(){
        //@ts-ignore
        vscode.postMessage({
            command: "codemirror-code-updated"
        });
    }

    // Cursor highlight related functions
    function reset_button_clicked(node: HTMLDivElement){
        cursor_highlight_button_clicked = false;
        current_index = 0;
    }

    function scrollToAnotherHighlight(next: boolean){
        if (!cursor_highlight_button_clicked){
            cursor_highlight_button_clicked = true;
        } else{
            // change index for next time
            // ((-1) % 5) = -1 in js so need to do this LMAO
            current_index = mod((current_index + ((next) ? 1 : -1)), highlight_data.all_wat_lines.length);
        }
        let line_number = highlight_data.all_wat_lines[current_index];
        const line = view.state.doc.line(line_number);
        view.dispatch({
            effects: EditorView.scrollIntoView(line.from, {
                y: "center" // options: "start", "center", "end", or "nearest"
            }
        )});
    }

    var mod = (n: number, m: number): number=> {
        return ((n % m) + m) % m;
    }

</script>

{#if !api_response.out_of_date}
   <div id="inject-code-button" transition:fade>
        <button onclick={update_codemirror}>Inject code</button>
        {#if !api_response.codemirror_code_updated}<p transition:fade>⚠️ Old code. Update</p>
        {:else if !api_response.model}<p transition:fade>🚫 Nothing injected </p>
        {/if}
    </div>
{/if}

<div use:load_html id="wasm-webview-code-editor"></div>

{#if highlight_data.all_wat_lines.length > 0}
    <div use:reset_button_clicked id="footer">
    <div class="button-container">
        <button onclick={() => {scrollToAnotherHighlight(false)}}>⬅️</button>
        <button onclick={() => {scrollToAnotherHighlight(true)}}>➡️</button>
    </div>
    <div id="cursorHighlightInfo">{cursor_highlight_button_clicked ? "Current" : "Next"} cursor highlight at: <span style="color:midnightblue;">Line {highlight_data.all_wat_lines[current_index]} <span style="font-size: xx-small;">({current_index+1}/{highlight_data.all_wat_lines.length})</span></span></div>
    </div>
{/if}

<style>
    div{
        width: 90%;
        margin: auto;
    }

    #inject-code-button{
        width: 50%;
        padding: 2%;
    }
    p {display: flex; justify-content: center;}

    #footer{
        position: fixed;
        text-align: center;
        /* Make sure it stays on top */
        z-index: 1000;
        background: rgba(128, 128, 128, 0.7);
        backdrop-filter: blur(10px);
        bottom: 0;
        left: 0;
        right: 0;
    }
    .button-container {
        display: flex;
        justify-content: center;
        gap: 5%;
    }
    .button-container button{
        background: transparent;
        width: 1em;
        font-size: x-large;
        outline: none;
    }
    .button-container button:hover{
        transform: scale(1.2);
    }

    #cursorHighlightInfo{
        font-family: var(--cm-editor-font-family, monospace);
        color: black;
        font-size: smaller;
    }
</style>
