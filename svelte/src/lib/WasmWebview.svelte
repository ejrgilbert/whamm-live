<script lang="ts">
  import { onDestroy, onMount } from "svelte";

    // content here should be array of all the bytes for our wasm file
    let { view, probe_data } = $props();
    const load_html = function(node: HTMLElement){
        // Remove focus highlight
        if (view) document.getElementById("wasm-webview-code-editor")?.appendChild(view.dom);
    }
    var probe_data_update_function: (event:MessageEvent) => void;

    onMount(()=>{
        probe_data_update_function = (event:MessageEvent) =>{
            let message = event.data;
            switch(message.command){
                case 'highlight':
                {
                    probe_data=message.data;
                    display_data();
                }
                break;
            }
        };
       window.addEventListener("message", probe_data_update_function);
    })

    onDestroy(()=>{
        window.removeEventListener("message", probe_data_update_function);
    });

    // Function that displays the data
    var display_data = ()=>{
        if (probe_data){
            // Show the highlight if probe data is not null
            console.log(probe_data);
        }
    }

</script>

<div use:load_html id="wasm-webview-code-editor"></div>
<style>
    div{
        width: 90%;
        margin: auto;
    }
</style>
