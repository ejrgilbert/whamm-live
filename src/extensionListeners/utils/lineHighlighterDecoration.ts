import * as vscode from 'vscode';
import { type highlights_info, inj_circle_highlights_info, jagged_array, span, WhammLiveInjection, WhammLiveResponseWasm, WhammLiveResponseWizard } from "../../model/types";
import { ExtensionContext } from '../../extensionContext';
import { WasmWebviewPanel } from '../../user_interface/wasmWebviewPanel';
import { isExtensionActive } from './listenerHelper';
import { ModelHelper } from '../../model/utils/model_helper';
import { Types } from '../../whammServer';
import { APIModel } from '../../model/api_model/model';
import { WizardWebviewPanel } from '../../user_interface/wizardWebviewPanel';
import { get_all_webviews } from '../documentChangesListener';
import { APIWasmModel } from '../../model/api_model/model_wasm';
import { APIWizardModel } from '../../model/api_model/model_wizard';

// 1 based line and column value
type whamm_highlight_data= {highlighed: boolean, line:number, column: number};

export class LineHighlighterDecoration{

    static decorations: vscode.TextEditorDecorationType[] = [];
    static ranges: vscode.Range[] = [];
    static whamm_highlight_data: whamm_highlight_data = {highlighed: false, line:-1, column: -1};
    static colors: string[] = [
        "rgba(76, 175, 80, 1)",
        "rgba(142, 36, 170, 1)",
        "rgba(244, 67, 54, 1)",
        "rgba(255, 235, 59, 1)",
        "rgba(255, 152, 0, 1)",
        "rgba(121, 85, 72, 1)",
        "rgba(233, 30, 99, 1)",
        "rgba(158, 158, 158, 1)",
        "rgba(0, 150, 136, 1)",
    ]

    static highlightColors: string []= [
            "rgba(76, 175, 80, 0.2)",    // soft green
            "rgba(142, 36, 170, 0.3)", // soft violet
            "rgba(244, 67, 54, 0.4)",    // soft red
            "rgba(255, 235, 59, 0.2)",   // soft yellow
            "rgba(255, 152, 0, 0.3)",    // soft orange
            "rgba(121, 85, 72, 0.4)",     // soft brown
            "rgba(233, 30, 99, 0.3)",     // rose pink
            "rgba(158, 158, 158, 0.3)",   // neutral gray
            "rgba(0, 150, 136, 0.3)",     // teal-green
    ]

    /**
     * 
     * @param highlight_data : record from color index to whamm span
     * @param jagged_array : null filled jagged array representing the structure of the whamm file
     * @returns 
     */
    static highlight_whamm_file(highlight_data: Record<number, [span, number]>, line: number, column: number, warn_user: boolean, editor_should_be_active: boolean){

        // We need to apply the highlights from biggest span to the lowest span
        let sorted_spans_color = Object.entries(highlight_data).sort((b,a)=>{return a[1][1] - b[1][1]});

        for (let [color_index, span] of sorted_spans_color){
            LineHighlighterDecoration.highlight_whamm_file_span(span[0],
                LineHighlighterDecoration.highlightColors[parseInt(color_index)], line, column, editor_should_be_active)
        }
        if (warn_user)
            vscode.window.showWarningMessage("Highlights may not be completely accurate. Try using only one target!")
    }

    static highlight_whamm_file_span(whamm_span: span, color: string, line: number, column: number, editor_should_be_active: boolean = true){

        var editors: vscode.TextEditor[];
        if (editor_should_be_active){
            let editor = vscode.window.activeTextEditor;
            if (!editor) return;
        }
        editors = ExtensionContext.get_editors();
        if (editors.length < 1) return;

        const start = new vscode.Position(whamm_span.lc0.l - 1, whamm_span.lc0.c -1);
        const end = new vscode.Position(whamm_span.lc1.l - 1, whamm_span.lc1.c -1);
        const range = new vscode.Range(start, end);

        let decorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: color,
            isWholeLine: false,
        })

        LineHighlighterDecoration.decorations.push(decorationType);
        LineHighlighterDecoration.ranges.push(range);
        LineHighlighterDecoration.whamm_highlight_data = {highlighed: true, line: line, column: column};

        for (let editor of editors){
            editor.setDecorations(decorationType, [range]);
        }
    }

    static restore_whamm_file_decorations(){
        let editors = ExtensionContext.get_editors();
        if (editors.length < 1) return;

        let decorations = LineHighlighterDecoration.decorations;
        let ranges = LineHighlighterDecoration.ranges;
        let whamm_highlight_data = LineHighlighterDecoration.whamm_highlight_data;

        LineHighlighterDecoration.clear_whamm_decorations();

        for (let editor of editors){
            for (let current_index=0; current_index < decorations.length; current_index++){
                editor.setDecorations(decorations[current_index], [ranges[current_index]]);
            }
        }
        LineHighlighterDecoration.decorations = decorations;
        LineHighlighterDecoration.ranges = ranges;
        LineHighlighterDecoration.whamm_highlight_data = whamm_highlight_data;
    }

    static highlight_wasm_webview_lines(webview: WasmWebviewPanel | WizardWebviewPanel, data1: highlights_info, data2: inj_circle_highlights_info, all_wat_lines: number[], injection_start_wat_lines: number[]){
        webview.webviewPanel.webview.postMessage({
            command: 'temp-line-highlight',
            line_data: data1,
            circle_data: data2,
            all_wat_lines: all_wat_lines,
            injection_start_wat_lines: injection_start_wat_lines,
        });
    }

    /**
     * 
     * @param webview 
     * @param number_value : is either the injection id or the wat line number
     * @param is_id 
     */
    static highlight_whamm_live_injection(original_webview: WasmWebviewPanel | WizardWebviewPanel, number_value: number, is_id: boolean=false){
        // If this is called because of the svelte communication, 
        // it is guaranteed to be a valid injection
        var original_injection: WhammLiveInjection | undefined;
        if (is_id)
            original_injection = original_webview.model.whamm_live_response.id_to_injection.get(number_value);
        else
            if (original_webview instanceof WasmWebviewPanel && original_webview.model instanceof APIWasmModel)
                original_injection= original_webview.model.wat_to_whamm_mapping.get(number_value);
            else if (original_webview instanceof WizardWebviewPanel && original_webview.model instanceof APIWizardModel)
                original_injection= original_webview.model.whamm_live_response.wat_to_injection.get(number_value);

        let all_editors = ExtensionContext.get_editors();
        if (all_editors.length > 0 && original_injection && isExtensionActive() && (all_editors[0].document.getText() === APIModel.whamm_cached_content)){
            LineHighlighterDecoration.clear_all_decorations();

            if (original_injection.whamm_span !== null){
                // highlight the whamm file
                LineHighlighterDecoration.highlight_whamm_file_span(original_injection.whamm_span, LineHighlighterDecoration.highlightColors[0], original_injection.whamm_span.lc0.l, original_injection.whamm_span.lc0.c, false);

                // highlight the line on the svelte side
                // there might be other injections with the same whamm span and if they exist, highlight those too
                // @todo: anything for wizard side?
                for (let webview of get_all_webviews()){
                    if (webview.model.__api_response_out_of_date || (!webview.model.codemirror_code_updated) || (webview.model.whamm_live_response.is_err)) continue;

                    let injections: WhammLiveInjection[] = [];
                    injections = get_injections_from_whamm_span(webview.model.whamm_live_response, original_injection.whamm_span, webview instanceof WizardWebviewPanel);

                    if (injections.length > 0){
                        let highlight_data: highlightCompleteData = LineHighlighterDecoration.get_highlight_data(injections);
                        LineHighlighterDecoration.highlight_wasm_webview_lines(webview, highlight_data.highlight_info, highlight_data.inj_circle_highlights_info, highlight_data.all_wat_lines, highlight_data.injection_start_wat_lines);
                    }
                }
            }
        }
    }

    // Get the highlight data for an array of injections
    private static get_highlight_data(injections: WhammLiveInjection[]): highlightCompleteData{

        let inj_circle_highlight_data: inj_circle_highlights_info = {};
        let highlight_data: highlights_info = {};
        let all_wat_lines: number[] = [];
        let injection_start_wat_lines: number[] = [];
        LineHighlighterDecoration.store_line_highlight_data(highlight_data, inj_circle_highlight_data, all_wat_lines, injection_start_wat_lines, injections, 0);

        return {
            all_wat_lines: all_wat_lines.sort(),
            highlight_info: highlight_data,
            inj_circle_highlights_info: inj_circle_highlight_data,
            injection_start_wat_lines: injection_start_wat_lines,
        } as highlightCompleteData;
    }

    static clear_all_decorations(){
        LineHighlighterDecoration.clear_whamm_decorations();
        this.clear_wasm_line_decorations();
    }

    static clear_whamm_decorations_if_necessary(){
        if ((ExtensionContext.context.workspaceState.get("whamm-file") !== undefined) && WasmWebviewPanel.number_of_webviews == 0 && WizardWebviewPanel.webview === null){
            // remove decorations if any
            LineHighlighterDecoration.clear_whamm_decorations();
        }
    }

    //Create a **many-to-one mapping** from wat line number to color to show in the webview 
    // and store it in the record
    // Also create a one-to-one injection ID to highlight color mapping for "circle" injections
    static store_line_highlight_data(line_record: highlights_info, inj_circle_record: inj_circle_highlights_info, all_wat_lines: number[], injection_start_wat_lines: number[], injections: WhammLiveInjection[], color_index: number){
        for (let live_injection of injections){
            switch(live_injection.type){
                case Types.WhammDataType.funcProbeType:
                case Types.WhammDataType.localType:
                case Types.WhammDataType.opProbeType:
                    // map from injection id to the color to highlight with
                    inj_circle_record[live_injection.id] = LineHighlighterDecoration.colors[color_index];
                    for (let wat_line=live_injection.wat_range.l1; wat_line <= live_injection.wat_range.l2; wat_line++){
                        all_wat_lines.push(wat_line);
                    }
                    break;

                default:
                    for (let wat_line=live_injection.wat_range.l1; wat_line <= live_injection.wat_range.l2; wat_line++){
                        // Overwrite any previous value since we give priority to lower whamm spans
                        line_record[wat_line] = LineHighlighterDecoration.highlightColors[color_index];
                        all_wat_lines.push(wat_line);
                    }
                break;
            }
            injection_start_wat_lines.push(live_injection.wat_range.l1);
        }
    }

    static clear_wasm_line_decorations(){
        for (let webview of get_all_webviews()){
            LineHighlighterDecoration.clear_wasm_line_decoration(webview);
        }
    }

    static clear_wasm_line_decoration(webview: WasmWebviewPanel | WizardWebviewPanel){
        LineHighlighterDecoration.highlight_wasm_webview_lines(webview, {}, {}, [], []);
    }

    static clear_whamm_decorations(){
        const editors = ExtensionContext.get_editors();
        for (let editor of editors){
            for (let decorationType of LineHighlighterDecoration.decorations){
                editor.setDecorations(decorationType, []);
            }
        }
        LineHighlighterDecoration.decorations = [];
        LineHighlighterDecoration.ranges = [];
        LineHighlighterDecoration.whamm_highlight_data = {highlighed: false, line:-1, column: -1};
    }

    static clear_whamm_and_webview_decorations(webview: WasmWebviewPanel){
        // clear the whamm line highlights
        LineHighlighterDecoration.clear_whamm_decorations();
        // clear the svelte webview side highlights
        LineHighlighterDecoration.clear_wasm_line_decoration(webview);
    }
}

type highlightCompleteData = {
    highlight_info: highlights_info;
    inj_circle_highlights_info: inj_circle_highlights_info;
    all_wat_lines: number[];
    injection_start_wat_lines: number[];
}

function get_injections_from_whamm_span(whamm_live_injections: WhammLiveResponseWasm | WhammLiveResponseWizard, whamm_span: span, wizard_response: boolean): WhammLiveInjection[]{
    let return_injections : WhammLiveInjection[] = [];

    if (wizard_response){
        var injection_array = ["injections"];
    } else
        var injection_array = ["injecting_injections", "other_injections"];

    for (const array of injection_array){
        // @ts-ignore
        for (let injection of whamm_live_injections[array]){
            if (injection.whamm_span && ModelHelper.compare_live_whamm_spans(injection.whamm_span, whamm_span)){
                return_injections.push(injection);
            }
        }
    }
    return return_injections;
}