import * as vscode from 'vscode';
import { type highlights_info, inj_circle_highlights_info, span } from "../model/types";
import { ExtensionContext } from '../extensionContext';
import { WhammWebviewPanel } from '../user_interface/webviewPanel';

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
            if (!editor) return
            if (editor.document.uri.fsPath !== ExtensionContext.context.workspaceState.get("whamm-file")) return;
        } else{
            editor = ExtensionContext.whamm_editor;
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

    static highlight_whamm_live_injection(webview: WhammWebviewPanel, wat_line: number){
        // If this is called because of the svelte communication, 
        // it is guaranteed to be a valid injection
        let injection = webview.model.wat_to_whamm_mapping.get(wat_line);
        if (injection){
                // clear the whamm line highlights
                LineHighlighterDecoration.clear_whamm_decorations(ExtensionContext.whamm_editor);
                // clear the svelte webview side highlights
                LineHighlighterDecoration.clear_wasm_line_decoration(webview);

            if (injection.whamm_span !== null){
                // highlight the whamm file
                LineHighlighterDecoration.highlight_whamm_file(injection.whamm_span, LineHighlighterDecoration.highlightColors[0], false);
                // highlight the line on the svelte side
                let highlight_info: highlights_info= {};
                highlight_info[wat_line] = LineHighlighterDecoration.highlightColors[0];
                LineHighlighterDecoration.highlight_wasm_webview_lines(webview, highlight_info, {}, [wat_line]);
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
}