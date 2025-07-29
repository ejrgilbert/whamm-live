import { jagged_array, span, WhammLiveInjection } from "../../model/types";
import { ModelHelper } from "../../model/utils/model_helper";

type BestEffortHighlightData = {
    // Span size to color mapping
    span_to_color_index: Record<number, number>;
    color_index_to_span: Record<number, [span, number]>;
}

export class BestEffortHighlight{

    /**
     * Perform best effort highlighting
     * @param sorted_live_injections : Sorted from biggest span size to least span size
     * @returns {BestEffortHighlightData} The data necessary to highlight the whamm file as well as the wat side
     */
    static run(sorted_live_injections: WhammLiveInjection[], jagged_array: jagged_array): BestEffortHighlightData{

        // spansize to color index: Will be necessary for wat side highlighting as every injection in the jagged array cell will have some spansize
        const span_to_color_index: Record<number,number>= {};
        // color to whamm_span values for whamm file highlighting
        const color_index_to_whamm_spans: Record<number,span[]>= {};
        var color_index = 0;

        var update_color_index_to_whamm_span = (color_index: number, current_pointer: WhammLiveInjection) =>{
                let array = color_index_to_whamm_spans[color_index] ?? [];
                if (!current_pointer.whamm_span) throw new Error("Whamm live injection doesn't have a span");
                array.push(current_pointer.whamm_span);
                color_index_to_whamm_spans[color_index] = array;
        }

        let previous_pointer: null | WhammLiveInjection = null;
        let current_index = 0;
        while (current_index < sorted_live_injections.length){
            let current_pointer = sorted_live_injections[current_index];
            // We expect a value since this injection is in the jagged array
            if (!current_pointer.whamm_span) throw new Error("Expected whamm span value. Found null");

            let current_span_size = ModelHelper.calculate_span_size(current_pointer.whamm_span, jagged_array)
            // If this is the first value!
            if (previous_pointer === null){
                span_to_color_index[current_span_size] = color_index;
                update_color_index_to_whamm_span(color_index, current_pointer);

            } else{
                if (!previous_pointer.whamm_span) throw new Error("Expected whamm span value. Found null");

                // exactly same span
                if (ModelHelper.compare_live_whamm_spans(current_pointer.whamm_span, previous_pointer.whamm_span)){
                    /**
                     * @ignore : skip to the next one since we have already handled this span value in the previous iteration
                     */
                } else {
                    let previous_span_size = ModelHelper.calculate_span_size(previous_pointer.whamm_span, jagged_array);

                    // same spansize but not the same span
                    // in this case, we **extend** the two spans to be part of one big span and do color highlighting based on that
                    if (current_span_size === previous_span_size){
                        update_color_index_to_whamm_span(color_index, current_pointer);

                    // Note: Code isn't refactored so that the code is easy to follow
                    } else if (current_span_size < previous_span_size){
                        // in this case, we use a new color now since the span is completely inside the previous one which gets higher priority
                        // if not, since they don't completely overlap we do like we did with same spansize but not the same span
                        if (ModelHelper.can_fit_span(previous_pointer.whamm_span, current_pointer.whamm_span))
                            color_index++;

                        span_to_color_index[current_span_size] = color_index;
                        update_color_index_to_whamm_span(color_index, current_pointer);

                    } else {
                        // error! the injections aren't sorted in terms of span size
                        throw new Error("Expected sorted whamm live injections from biggest span size to least span size");
                    }
                }
            }
            // Traverse to the next element
            previous_pointer = current_pointer;
            current_index++;
        }

        // unionize the whamm spans
        const color_index_to_whamm_span: Record<number, [span, number]> = {};
        for (let i=0; i <= color_index; i++){
            let spans = color_index_to_whamm_spans[i];
            if (spans?.length > 0){
                let unionized_span = BestEffortHighlight.unionize_whamm_spans(spans, jagged_array);
                color_index_to_whamm_span[i] = [unionized_span, ModelHelper.calculate_span_size(unionized_span, jagged_array)];
            }
        }
        return {span_to_color_index: span_to_color_index, color_index_to_span: color_index_to_whamm_span} as BestEffortHighlightData;
    }

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
        if (end_col >= jagged_array[end_line-1].length) {end_col = 1, end_line++}
        else {end_col++}

        let whamm_span : span = {
            lc0: {
                l: start_line,
                c: start_col
            },
            lc1: {
                l: end_line,
                c: end_col
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