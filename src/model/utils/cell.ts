import { span, WhammLiveInjection } from "../types";

export class Cell{
    private __head: Node | null;
    private __length: number;

    constructor(head: Node | null, initial_length: number){
        this.__head = head;
        this.__length = initial_length;
    }

    /* Getter and setters */

    get head(): Node | null{
        return this.__head;
    }

    get length(){
        return this.__length;
    }

    set head(new_value: Node){
        this.__head = new_value;
    }

    set length(new_length: number){
        this.__length = new_length;
    }
}

export class Node{
    next: Node | null;
    whamm_spansize: number;
    values: WhammLiveInjection[];
    whamm_span: span | null;

    constructor(next: Node| null, whamm_span: span | null, values: WhammLiveInjection[], jagged_array: (Cell | null)[][]){
        this.next = next;
        this.whamm_span = whamm_span;
        this.values = values;
        this.whamm_spansize = Node.calculate_span_size(whamm_span, jagged_array);
    }

    // Calculate the whamm span size in columns
    // returns -1 if no whamm span
    static calculate_span_size(whamm_span: span | null, jagged_array: (Cell|null)[][]) : number{
        if (whamm_span == null) return -1;

        let current_row = whamm_span.lc0.l -1;
        // inclusive end row
        const end_row = whamm_span.lc1.l -1;
        let current_col= whamm_span.lc0.c - 1;
        // exclusive col value
        const end_col = whamm_span.lc1.c - 1; 

        // The idea: increase the 
        // if start_col exceeeds length then the value will be 0(move to the next row)
        // and number of rows increases
        let total_columns = 0;
        if (current_row > end_row || ((current_row == end_row) && current_col >= end_col)) return 0;

        while (current_row !== end_row || current_col !== end_col){
            if (jagged_array[current_row].length == 0){
                current_col = 0;
                current_row++;
            } else {
                current_col++;
                if (current_col >= jagged_array[current_row].length){
                    current_col = 0;
                    current_row++;
                }
                total_columns++;
            }
        }
        return total_columns;
    }
}