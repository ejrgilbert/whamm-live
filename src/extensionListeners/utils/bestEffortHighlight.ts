import { jagged_array, span, WhammLiveInjection } from "../../model/types";
import { ModelHelper } from "../../model/utils/model_helper";

type BestEffortHighlightData = {
    // Span size to color mapping
    span_to_color_index: Record<number, number>;
    color_index_to_span: Record<number, span>;
}

export class BestEffortHighlight{

    // Record's key is the color index[which is the priority index] and the value is the list of spans to color
    // returns the union of the spans for each color index
    static unionize_whamm_spans(spans: span[], jagged_array: jagged_array): span{
        if (spans.length < 1) throw new Error("Whamm span union error: Expected at least *1* span");
        let all_line_col_values: [number, number][]= []
        for (let span of spans){
            all_line_col_values.push(...ModelHelper.get_line_col_values(span, jagged_array));
        }

        // NOTE: because of problems with object equality for arrays in js, this **bad** approach is taken here
        // If there is a better way, please do make a PR :)
        let unique_values = new Set(all_line_col_values.map(([line, col]) => `${line},${col}`));
        const unique_line_col_pairs = Array.from(unique_values)
            .map(str => {
                const [line, col] = str.split(',').map(Number);
                return [line, col] as [number, number];
        });

        unique_line_col_pairs.sort((a, b) => {
            if (a[0] !== b[0]) return a[0] - b[0]; // Compare lines
            return a[1] - b[1]; // If lines are equal, compare columns
        });


        let [start_line, start_col] = unique_line_col_pairs[0];
        let [end_line, end_col] = unique_line_col_pairs[unique_line_col_pairs.length -1];
        let whamm_span : span = {
            lc0: {
                l: start_line,
                c: start_col
            },
            lc1: {
                l: end_line,
                c: end_col+1
            }
        };
        // make sure the line,col pairs are continous
        let values = ModelHelper.get_line_col_values(whamm_span, jagged_array);
        if (!BestEffortHighlight.are_same_line_col_values(values, unique_line_col_pairs)) throw new Error("Whamm unionize error: Expected continous overlapping whamm spans")

        return whamm_span;
    }

    static are_same_line_col_values(line_col_value_one: [number, number][], line_col_value_two: [number, number][]){
        if (line_col_value_one.length !== line_col_value_one.length) return false;
        for (let i =0; i < line_col_value_one.length; i++){
            let [l1, c1] = line_col_value_one[i];
            let [l2, c2] = line_col_value_two[i];
            if ((l1 !== l2) || (c1 !== c2)) return false;
        }
        return true;
    }
}