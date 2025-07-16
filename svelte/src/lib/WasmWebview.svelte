<script lang="ts">
  import { fade } from "svelte/transition";
  import { api_response } from "./api_response.svelte";

    // Code mirror view
    let { view } = $props();
    const load_html = function(node: HTMLElement){
        if (view) document.getElementById("wasm-webview-code-editor")?.appendChild(view.dom);
    }
</script>

{#if !$api_response.out_of_date}
   <div id="inject-code-button" transition:fade><button>Inject code</button></div>
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
</style>
