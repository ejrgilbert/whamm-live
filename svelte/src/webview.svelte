<script lang="ts">
    import WizardWebview from './utils/WizardWebview.svelte';
    import WasmWebview from './utils/WasmWebview.svelte';
    import {wast} from "@codemirror/lang-wast";
    import {EditorView, basicSetup} from "codemirror"
    import { search, searchKeymap } from "@codemirror/search";
    import { keymap, lineNumbers} from "@codemirror/view";
    import { api_response, config} from "./utils/data/api_response.svelte";
    import { EditorState} from "@codemirror/state";
    import { lineBackgroundField } from './utils/code_mirror/injected_line_highlight';
    import { injectionCircleGutter, updateInjectionCircles } from './utils/code_mirror/gutter_view';
    import { highlight_data , highlight_style, reset_highlight_data, update_highlight_data } from './utils/data/highlight_data.svelte';
    import { setTempBackgroundColorForLines, tempLineBackgroundField } from './utils/code_mirror/temp_line_highlight';
    import  { code_click_handler } from './utils/code_mirror/code_click_handler';

    // svelte-ignore non_reactive_update
    var view : EditorView | undefined = undefined;

    // event listener to update html on change to workspace data
    window.addEventListener("message" , (event)=>{
            let message = event.data;
            switch(message.command){
                    case 'init-data':
                        {const message = event.data;
                        if (message) {
                            if (message.show_wizard){
                                config.show_wizard = true;
                            }
                            else {
                                api_response.wat = message.wat_content;
                                config.init_complete = true;
                            }

                            let extensions= [basicSetup, wast(), 
                                            highlight_style,
                                            EditorView.editable.of(false),
                                            EditorView.contentAttributes.of({tabindex: "0"}),
                                            EditorState.readOnly.of(true),
                                            search({top: false}),
                                            keymap.of(searchKeymap),
                                            lineBackgroundField,
                                            tempLineBackgroundField,
                                            code_click_handler,
                                            lineNumbers(),
                                            ]
                            // specific extensions
                            if (!message.show_wizard)
                                extensions.push(injectionCircleGutter);

                            //Create codemirror code block for the parsed wat content
                            view = new EditorView({
                                parent: document.getElementById("wasm-webview-code-editor") || document.body,
                                doc: api_response.wat,
                                extensions: extensions,
                            })
                        }
                        }
                    break;
                case 'api-response-update':{
                        api_response.out_of_date = message.response.out_of_date;
                        api_response.codemirror_code_updated = false;
                        if (config.show_wizard)
                            {
                                api_response.wizard_model = message.response.model;
                                api_response.wasm_model = null;
                            }
                        else
                            {
                                api_response.wasm_model = message.response.model;
                                api_response.wizard_model = null;
                            }
                        reset_highlight_data();
                    }
                    break;
                // Will be called to clear out the line highlights and circle highlights as well
                case 'temp-line-highlight':{
                    // circle data will be {} for wizard target which is okay!
                    // because we can use the same approach for both wasm and wizard target
                    update_highlight_data(message.line_data, message.circle_data, message.all_wat_lines, message.injection_start_wat_lines);
                    if (view && api_response.codemirror_code_updated) {
                        if ((config.show_wizard && api_response.wizard_model) || (!config.show_wizard && api_response.wasm_model)){
                            setTempBackgroundColorForLines(view, highlight_data.lines);
                            if (!config.show_wizard && api_response.wasm_model) updateInjectionCircles(view, api_response.wasm_model, highlight_data.circles);
                        }
                    }
                }
                case 'init-wat-wizard':
                    {
                        config.init_complete = true;
                    }
                    break;
            }
    });

</script>

<main>
    {#if config.show_wizard}
       <WizardWebview view={view}/>
    {:else}
       <WasmWebview view={view}/>
    {/if}

</main>

<style>
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
