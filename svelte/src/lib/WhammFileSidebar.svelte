<script lang="ts">
    import {fade} from 'svelte/transition';
    import WasmFileButton from './WasmFileButton.svelte'

    // Reactive variables
    let whamm_file = $state(null);

    const openWhammFile = (event: Event) =>{
        // @ts-ignore
        vscode.postMessage({
            command: "open-whamm-file"
        });
    }

    // event listener to update html on change to workspace data
    window.addEventListener("message" , (event)=>{
            const message = event.data;
            if (message) {
                if (message.command == 'workspace-whamm-update'){
                    whamm_file = message.whamm_file;
                }
            }
    });

</script>

<button type='button' onclick={openWhammFile}>Open Whamm file</button>

{#if whamm_file }
<div style="text-align: center; padding: 5%; color:grey" transition:fade>Current file: {whamm_file}</div>

<WasmFileButton />
{/if}

