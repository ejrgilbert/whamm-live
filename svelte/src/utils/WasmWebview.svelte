<script lang="ts">
  import { api_response, post_codemirror_updated } from "./data/api_response.svelte";
  import { clearBackgroundColors, setBackgroundColorForLines } from "./code_mirror/injected_line_highlight";
  import { addDanglingCircleInjections, clearInjectedCircles} from "./code_mirror/gutter_view";
  import InjectCodeButton from "./misc/InjectCodeButton.svelte";
  import { legend_wasm_config } from "./data/legend_config.svelte";
  import Legend from "./misc/Legend.svelte";
  import HighlightNavigation from "./misc/HighlightNavigation.svelte";

    // Code mirror view
    const { view } = $props();

    const load_html = function(node: HTMLElement){
        if (view) document.getElementById("wasm-webview-code-editor")?.appendChild(view.dom);
    }

    function update_codemirror(){
        api_response.codemirror_code_updated = true;
        let wat_content: string = (api_response.wasm_model) ? api_response.wasm_model.injected_wat : api_response.wat;

        // Update codemirror content
        const transaction = view.state.update({
            changes: { from: 0, to: view.state.doc.length, insert: wat_content }
        });
        view.dispatch(transaction);
        // clear all the previously injected circles and background colors
        clearInjectedCircles(view);
        clearBackgroundColors(view);

        // Update line highlights and dangling circles injected
        if (api_response.wasm_model){
            setBackgroundColorForLines(view, api_response.wasm_model.lines_injected, "bg-injected")
            addDanglingCircleInjections(view, api_response.wasm_model);
        }

        // update the extension side about the update
        post_codemirror_updated();
    }


</script>

<InjectCodeButton callback={update_codemirror}/>
<Legend legend_config={legend_wasm_config} />

<div use:load_html id="wasm-webview-code-editor"></div>

<HighlightNavigation view={view}/>

<style>
    div{
        width: 90%;
        margin: auto;
    }
</style>
