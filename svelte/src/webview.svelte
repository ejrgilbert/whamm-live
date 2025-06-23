<script lang="ts">
    import WizardWebview from './lib/WizardWebview.svelte';
    import WasmWebview from './lib/WasmWebview.svelte';
    import {wast} from "@codemirror/lang-wast";
    import {EditorView, basicSetup} from "codemirror"
    import wabt from 'wabt';

    // Init WABT
    // @ts-ignore
    var WABT : WabtModule | undefined = undefined;
    // @ts-ignore
    var module : WasmModule;
    wabt().then(wabt_=>{
        WABT = wabt_;});

    let wizard_tab = $state(false);

    // svelte-ignore non_reactive_update
    var view : EditorView | undefined = undefined;
    var file_name : string | undefined = $state(undefined);

    const changeTabSelected = () => {
        wizard_tab = !wizard_tab;
    }

    // injected-data related variables
    var probe_data = $state(null);

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
                                // Get wat text from wasm content
                                // and pass the code view
                                var string_contents = get_wat(
                                    (message.is_wasm) ? true: false,
                                    (message.is_wasm) ? message.wasm_file_contents : message.wat_file_contents,
                                    message.file_name);
                                
                                // Send the information back to extension so that the infromation is saved
                                // @ts-ignore
                                vscode.postMessage({
                                    command: 'store_wat',
                                    wat_content: string_contents,
                                })

                                //Create codemirror code block for the parsed wat content
                                view = new EditorView({
                                    parent: document.getElementById("wasm-webview-code-editor") || document.body,
                                    doc: string_contents,
                                    extensions: [basicSetup, wast(), EditorView.editable.of(false)]
                                })
                            }
                        }
                        }
                    break;
            }
    });

    // Helper functions
    const get_wat = function(is_in_wasm: boolean, file_contents: string | Uint8Array | undefined, file_name: string): string{ 
        if (file_contents && WABT){
            if (is_in_wasm){
                module = WABT.readWasm(file_contents, {readDebugNames: true});
            } else{
                module = WABT.parseWat(file_name, file_contents, {readDebugNames: true});
            }
            module.applyNames();
            return module.toText({ foldExprs: false, inlineExport: false });
        }
        return "No file loaded";
    }
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
       <WasmWebview view={view} probe_data={probe_data}/>
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
