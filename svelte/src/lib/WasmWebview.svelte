<script lang="ts">
  import { blur, fade } from "svelte/transition";
  import { api_response } from "./api_response.svelte";

    // Code mirror view
    const { view } = $props();
    const load_html = function(node: HTMLElement){
        if (view) document.getElementById("wasm-webview-code-editor")?.appendChild(view.dom);
    }

    function update_codemirror(){
        api_response.codemirror_code_updated = true;
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
        {#if !api_response.codemirror_code_updated}<p transition:fade>⚠️ Old code. Update</p>{/if}
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
