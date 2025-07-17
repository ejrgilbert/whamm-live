<script lang="ts">
    import WizardWebview from './lib/WizardWebview.svelte';
    import WasmWebview from './lib/WasmWebview.svelte';
    import {wast} from "@codemirror/lang-wast";
    import {EditorView, basicSetup} from "codemirror"
    import { HighlightStyle, syntaxHighlighting} from "@codemirror/language";
    import { tags as t } from "@lezer/highlight";
    import { search, searchKeymap } from "@codemirror/search";
    import { keymap, lineNumbers} from "@codemirror/view";
    import { api_response} from "./lib/api_response.svelte";
    import { EditorState} from "@codemirror/state";
    import { lineBackgroundField } from './lib/code_mirror/injected_line_highlight';
    import { injectionCircleGutter } from './lib/code_mirror/gutter_view';

    let wizard_tab = $state(false);

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
                                api_response.original_wat = message.wat_content;

                                const highlight_style =  syntaxHighlighting(HighlightStyle.define([
                                    { tag: t.keyword, color: '#317CD6' },
                                    { tag: t.typeName, color: '#317CD6' },
                                    { tag: t.number, color: '#B5CE9B' },
                                    { tag: t.string, color: '#CE834D' },
                                    { tag: t.variableName, color: '#53B9FE' },
                                    { tag: t.lineComment, color: '#549955' },
                                    { tag: t.blockComment, color: '#549955' },
                                    { tag: t.paren, color: '#DA70CB' },
                                ]))                       
                                //Create codemirror code block for the parsed wat content
                                view = new EditorView({
                                    parent: document.getElementById("wasm-webview-code-editor") || document.body,
                                    doc: api_response.original_wat,
                                    extensions: [basicSetup, wast(), 
                                                highlight_style,
                                                EditorView.editable.of(false),
                                                EditorView.contentAttributes.of({tabindex: "0"}),
                                                EditorState.readOnly.of(true),
                                                search({top: false}),
                                                keymap.of(searchKeymap),
                                                lineBackgroundField,
                                                
                                                // gutters
                                                lineNumbers(),
                                                injectionCircleGutter]
                                })
                            }
                        }
                        }
                    break;
                case 'api-response-update':{
                        api_response.out_of_date = message.response.out_of_date;
                        api_response.codemirror_code_updated = false;
                        api_response.model = message.response.model;
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

:global(.cm-line.bg-injected) {
background-color: rgba(90, 150, 255, 0.3);
  background-image: repeating-linear-gradient(
    45deg,
    rgba(0, 0, 0, 0.05),
    rgba(0, 0, 0, 0.05) 1px,
    transparent 1px,
    transparent 6px
  );
}
</style>
