<script lang="ts">
  import { Circle3 } from "svelte-loading-spinners";
  import { fade } from "svelte/transition";
  import { api_response, config, post_codemirror_updated } from "./api_response.svelte";
  import InjectCodeButton from "./InjectCodeButton.svelte";
  import { clearBackgroundColors, setBackgroundColorForLines } from "./code_mirror/injected_line_highlight";

    const { view } = $props();
    const load_html = function(node: HTMLElement){
        if (view) document.getElementById("wasm-webview-code-editor")?.appendChild(view.dom);
    }

    function update_codemirror(){
        api_response.codemirror_code_updated = true;

        // Update codemirror content
        const transaction = view.state.update({
            changes: { from: 0, to: view.state.doc.length, insert: (api_response.wizard_model) ? api_response.wizard_model.injected_wat : ";; Error on whamm side!\n ;; Make sure your whamm file doesn't have any errors"}
        });
        view.dispatch(transaction);

        clearBackgroundColors(view);
        // visualize lines caused by some logic in the whamm script!
        if (api_response.wizard_model !== null)
            setBackgroundColorForLines(view, api_response.wizard_model.whamm_file_related_wat_lines, "bg-injected");

        // clear highlights, stars @todo

        // update the extension side about the update
        post_codemirror_updated();
    }

</script>

{#if !config.init_complete}
    <div style="justify-content: center; display:grid" out:fade>
        <Circle3 size="50" duration="3s"/>
        <h3>Loading...</h3>
    </div>
{:else}
    <InjectCodeButton callback={update_codemirror} />
    <div use:load_html id="wasm-webview-code-editor"></div>
{/if}
