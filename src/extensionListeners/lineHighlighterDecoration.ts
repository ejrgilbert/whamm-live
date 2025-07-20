import * as vscode from 'vscode';
import { type highlights_info, inj_circle_highlights_info, span, WhammLiveInjection } from "../model/types";
import { ExtensionContext } from '../extensionContext';
import { WhammWebviewPanel } from '../user_interface/webviewPanel';
import { isExtensionActive } from './listenerHelper';

export class LineHighlighterDecoration{

    static decorations: vscode.TextEditorDecorationType[] = [];
    static colors: string[] = [
        "rgba(76, 175, 80, 1)",
        "rgba(244, 67, 54, 1)",
        "rgba(255, 235, 59, 1)",
        "rgba(142, 36, 170, 1)",
        "rgba(255, 152, 0, 1)",
        "rgba(121, 85, 72, 1)",
        "rgba(233, 30, 99, 1)",
        "rgba(158, 158, 158, 1)",
        "rgba(0, 150, 136, 1)",
    ]

    static highlightColors: string []= [
            "rgba(76, 175, 80, 0.2)",    // soft green
            "rgba(244, 67, 54, 0.4)",    // soft red
            "rgba(255, 235, 59, 0.2)",   // soft yellow
            "rgba(142, 36, 170, 0.3)", // soft violet
            "rgba(255, 152, 0, 0.3)",    // soft orange
            "rgba(121, 85, 72, 0.4)",     // soft brown
            "rgba(233, 30, 99, 0.3)",     // rose pink
            "rgba(158, 158, 158, 0.3)",   // neutral gray
            "rgba(0, 150, 136, 0.3)",     // teal-green
    ]

    static highlight_whamm_file(whamm_span: span, color: string, editor_should_be_active: boolean = true){

        var editor;
        if (editor_should_be_active){
            editor = vscode.window.activeTextEditor;
            if (!editor) return;
            if (editor.document.uri.fsPath !== ExtensionContext.context.workspaceState.get("whamm-file")) return;
        } else{
            editor = ExtensionContext.whamm_editor;
            if (!editor) return;
        }

        const start = new vscode.Position(whamm_span.lc0.l - 1, whamm_span.lc0.c -1);
        const end = new vscode.Position(whamm_span.lc1.l - 1, whamm_span.lc1.c -1);
        const range = new vscode.Range(start, end);

        let decorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: color,
            isWholeLine: false,
        })
        LineHighlighterDecoration.decorations.push(decorationType);
        editor.setDecorations(decorationType, [{range}]);
    }

    static highlight_wasm_webview_lines(webview: WhammWebviewPanel, data1: highlights_info, data2: inj_circle_highlights_info, all_wat_lines: number[] ){
        webview.webviewPanel.webview.postMessage({
            command: 'temp-line-highlight',
            line_data: data1,
            circle_data: data2,
            all_wat_lines: all_wat_lines
        });
    }

    /**
     * 
     * @param webview 
     * @param number_value : is either the injection id or the wat line number
     * @param is_id 
     */
    static highlight_whamm_live_injection(webview: WhammWebviewPanel, number_value: number, is_id: boolean=false){
        // If this is called because of the svelte communication, 
        // it is guaranteed to be a valid injection
        var injection: WhammLiveInjection | undefined;
        if (is_id)
            injection = webview.model.whamm_live_response.id_to_injection.get(number_value);
        else
            injection = webview.model.wat_to_whamm_mapping.get(number_value);

        if (injection && isExtensionActive()){
            LineHighlighterDecoration.clear_all_decorations(ExtensionContext.whamm_editor);

            if (injection.whamm_span !== null){
                // highlight the whamm file
                LineHighlighterDecoration.highlight_whamm_file(injection.whamm_span, LineHighlighterDecoration.highlightColors[0], false);
                let highlight_info: highlights_info | inj_circle_highlights_info = {};

                // highlight the line on the svelte side
                if (is_id){
                    highlight_info[number_value] = LineHighlighterDecoration.colors[0];
                    let all_wat_lines = [];
                    for (let start_line=injection.wat_range.l1; start_line <= injection.wat_range.l2; start_line++){
                        all_wat_lines.push(start_line);
                    }
                    LineHighlighterDecoration.highlight_wasm_webview_lines(webview, {}, highlight_info, all_wat_lines.sort());
                } else{
                    highlight_info[number_value] = LineHighlighterDecoration.highlightColors[0];
                    LineHighlighterDecoration.highlight_wasm_webview_lines(webview, highlight_info, {}, [number_value]);
                }
            }
        }
    }

    static clear_all_decorations(editor: vscode.TextEditor | undefined){
        if (editor){
            LineHighlighterDecoration.clear_whamm_decorations(editor);
            this.clear_wasm_line_decorations();
        }
    }

    static clear_wasm_line_decorations(){
        for (let webview of WhammWebviewPanel.webviews){
            LineHighlighterDecoration.clear_wasm_line_decoration(webview);
        }
    }

    static clear_wasm_line_decoration(webview: WhammWebviewPanel){
        LineHighlighterDecoration.highlight_wasm_webview_lines(webview, {}, {}, []);
    }

    static clear_whamm_decorations(editor: vscode.TextEditor){
        for (let decorationType of LineHighlighterDecoration.decorations){
            editor.setDecorations(decorationType, []);
        }
        LineHighlighterDecoration.decorations = [];
    }

    static clear_whamm_and_webview_decorations(webview: WhammWebviewPanel){
        // clear the whamm line highlights
        if (ExtensionContext.whamm_editor) LineHighlighterDecoration.clear_whamm_decorations(ExtensionContext.whamm_editor);
        // clear the svelte webview side highlights
        LineHighlighterDecoration.clear_wasm_line_decoration(webview);
    }
}