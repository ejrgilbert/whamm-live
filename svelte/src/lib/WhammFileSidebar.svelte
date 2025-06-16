<script lang="ts">
    import {fade, slide} from 'svelte/transition';

    let whamm_file = $state(null);
    let show_wat_button = $derived(whamm_file !== null);
    let wat_button_text = $derived(show_wat_button ? "Open <i>.wat</i> or <i>wasm file</i></button>" : "Open Wizard wasm monitor");
    let  arrow_value = $derived(show_wat_button ? "↓" : "↑");

    const openWhammFile = (event: Event) =>{
        // @ts-ignore
        vscode.postMessage({
            command: "open-whamm-file"
        });
    }

    // Update show_wat_button value
    const changeShowWatButton = (event: Event) =>{
        show_wat_button = (show_wat_button) ? false : true;
    }

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

    <div class="webview-display-button-div" transition:slide>
        <button class="webview-display-button" type="button">{@html wat_button_text}</button>   
        <button class="webview-display-button-inline" onclick={changeShowWatButton}>{arrow_value}</button>
    </div>
{/if}

<style>

.webview-display-button-div{
    display: flex;
    width: 100%; 
    align-items: stretch;
}

.webview-display-button{
    flex: 0 0 80%;
}

.webview-display-button-inline{
    flex: 0 0 20%;
    border-left: solid;
    border-style: thin;
    border-left-color: black;
}
</style>
