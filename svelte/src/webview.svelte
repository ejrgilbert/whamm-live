<script lang="ts">
    import WizardWebview from './lib/WizardWebview.svelte';
    import WasmWebview from './lib/WasmWebview.svelte';
    import {wast} from "@codemirror/lang-wast";
    import {EditorView, basicSetup} from "codemirror"
    import {probe_data} from './lib/probe_data.svelte';

    let wizard_tab = $state(false);
    let wat_content : undefined | string = $state(undefined);

    // svelte-ignore non_reactive_update
    var view : EditorView | undefined = undefined;
    var file_name : string | undefined = $state(undefined);

    const changeTabSelected = () => {
        wizard_tab = !wizard_tab;
    }

    // event listener to update html on change to workspace data
    window.addEventListener("message" , (event)=>{
            let message = event.data;
            switch(message.command){
                    case 'init-data':
                        {const message = event.data;
                        if (message) {
                            file_name = message.file_name;

                            if (message.show_wizard)
                                wizard_tab = true;
                            else {
                                wat_content = message.wat_content;

                                //Create codemirror code block for the parsed wat content
                                view = new EditorView({
                                    parent: document.getElementById("wasm-webview-code-editor") || document.body,
                                    doc: wat_content,
                                    extensions: [basicSetup, wast(), EditorView.editable.of(false)]
                                })
                            }
                        }
                        }
                    break;
            }
    });
</script>

<main>
    {#if file_name}
    <div class="tab">
        <button onclick={changeTabSelected} class="tab-option">Switch to {wizard_tab? "static bytecode": "Wizard"}</button>
    </div>
    {/if}

    {#if wizard_tab}
       <WizardWebview />
    {:else}
       <WasmWebview view={view}/>
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
