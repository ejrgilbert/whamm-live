<script lang="ts">
    import WizardWebview from './lib/WizardWebview.svelte';
    import WasmWebview from './lib/WasmWebview.svelte';
    // Current value
    let wizard_tab = $state(false);
    let file_contents : string | undefined = $state(undefined);

    const changeTabSelected = () => {
        wizard_tab = !wizard_tab;
    }

    // event listener to update html on change to workspace data
    window.addEventListener("message" , (event)=>{
            const message = event.data;
            if (message) {
                if (message.show_wizard)
                    wizard_tab = true;
                else {
                    file_contents = message.wasm_file_contents;
                }
            }
    });

</script>

<main>
    <div class="tab">
        <button onclick={changeTabSelected} class="tab-option">Switch to {wizard_tab? "static bytecode": "Wizard"}</button>
    </div>
    {#if wizard_tab}
       <WizardWebview />
    {:else}
       <WasmWebview contents={file_contents}/>
    {/if}

</main>

<style>
.tab{
    transition: all .5s ease-in-out;
}

.tab:hover { transform: scale(1.1); }

.tab button{
    padding: 1.5%;
}
</style>
