<script lang="ts">
    import WizardWebview from './lib/WizardWebview.svelte';
    import WasmWebview from './lib/WasmWebview.svelte';
    import {wast} from "@codemirror/lang-wast";
    import {EditorView, basicSetup} from "codemirror"
    import { HighlightStyle, syntaxHighlighting} from "@codemirror/language";
    import { tags as t } from "@lezer/highlight";
    import { search, searchKeymap } from "@codemirror/search";
    import { keymap, lineNumbers} from "@codemirror/view";
    import { api_response } from "./lib/api_response.svelte";
    import { EditorState} from "@codemirror/state";
    import { lineBackgroundField } from './lib/code_mirror/injected_line_highlight';
    import { injectionCircleGutter, updateInjectionCircles } from './lib/code_mirror/gutter_view';
    import { highlight_data , highlight_style, reset_highlight_data, update_highlight_data } from './lib/highlight_data.svelte';
  import { setTempBackgroundColorForLines, tempLineBackgroundField } from './lib/code_mirror/temp_line_highlight';
  import  { code_click_handler } from './lib/code_mirror/code_click_handler';

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
                                                tempLineBackgroundField,
                                                code_click_handler,
                                                
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
                        reset_highlight_data();
                    }
                    break;
                // Will be called to clear out the line highlights and circle highlights as well
                case 'temp-line-highlight':{
                    update_highlight_data(message.line_data, message.circle_data, message.all_wat_lines);
                    if (view && api_response.model && api_response.codemirror_code_updated) {
                        setTempBackgroundColorForLines(view, highlight_data.lines);
                        updateInjectionCircles(view, api_response.model, highlight_data.circles);
                    }
                }
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
