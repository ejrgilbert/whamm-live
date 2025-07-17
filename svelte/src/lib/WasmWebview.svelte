<script lang="ts">
  import { fade } from "svelte/transition";
  import { api_response } from "./api_response.svelte";
  import { clearBackgroundColors, setBackgroundColorForLines } from "./code_mirror/injected_line_highlight";
  import { addDanglingCircleInjections, clearCirclesEffect, clearInjectedCircles, injectionCircleEffect} from "./code_mirror/gutter_view";
  import { debug } from "console";

    // Code mirror view
    const { view } = $props();
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
</style>
