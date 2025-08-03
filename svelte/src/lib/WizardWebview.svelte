<script lang="ts">
  import { Circle3 } from "svelte-loading-spinners";
  import { fade } from "svelte/transition";
  import { config } from "./api_response.svelte";
  import InjectCodeButton from "./InjectCodeButton.svelte";

    const { view } = $props();
    const load_html = function(node: HTMLElement){
        if (view) document.getElementById("wasm-webview-code-editor")?.appendChild(view.dom);
    }

    function update_codemirror(){

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
