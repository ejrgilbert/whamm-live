<script lang="ts">
    import {slide} from 'svelte/transition';
    import WhammApiTracker from './WhammApiTracker.svelte';

    let show_wat_button = $state(true)
    let wat_button_text = $derived(show_wat_button ? "Open <i>.wat</i> or <i>.wasm</i> file</button>" : "Open Wizard wasm monitor");
    let  arrow_value = $derived(show_wat_button ? "↓" : "↑");

    // Update show_wat_button value
    const changeShowWatButton = (event: Event) =>{
        show_wat_button = (show_wat_button) ? false : true;
    };

    const openWatWasmFile = (event: Event)=>{
        // @ts-ignore
        vscode.postMessage({
            command: "open-wat/wasm-file",
            wasm_wizard_engine: !show_wat_button,
        });
    }

</script>

<div class="webview-display-button-div" transition:slide>
    <button class="webview-display-button" type="button" onclick={openWatWasmFile}>{@html wat_button_text}</button>   
    <button class="webview-display-button-inline" onclick={changeShowWatButton}>{arrow_value}</button>
</div>

<WhammApiTracker />

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