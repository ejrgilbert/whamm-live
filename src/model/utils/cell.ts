import { span, WhammLiveInjection } from "../types";
import { ModelHelper } from "./model_helper";

export class Cell{
    private __head: Node ;

    constructor(whamm_live_injection: WhammLiveInjection, span_size: number){
        this.__head = new Node(null, whamm_live_injection.whamm_span, [whamm_live_injection], span_size);
    }

    // span cols calculated beforehand since it makes it time efficient
    // linked list is supposed to be sorted from biggest span size to the smallest span size
    add(live_injection: WhammLiveInjection, span_cols: number){
        if (live_injection.whamm_span === null) throw new Error("Cannot add a live injection with no span");
        
        // Current node is the node **before** which we need to insert
        let current_node : Node | null = this.__head;
        // only null initially
        let previous_node: null | Node = null;
        let injection_inserted = false;

        while (!injection_inserted){

            // Insert at the end case
            if (current_node === null){
                if (previous_node === null) throw new Error("Previous node cannot be null when current node is also null")
                let new_node = new Node(null, live_injection.whamm_span, [live_injection], span_cols);
                previous_node.next = new_node;
                injection_inserted = true;

            } else if (span_cols < current_node.whamm_spansize){
                // go to the next node
                previous_node = current_node;
                current_node = current_node.next;

            } else if (span_cols == current_node.whamm_spansize){
                // check if whamm span is the same
                if (current_node.whamm_span === null) throw new Error("Cell value cannot have a null whamm span");
                if (ModelHelper.compare_live_whamm_spans(live_injection.whamm_span, current_node.whamm_span)){
                    current_node.values.push(live_injection);
                    injection_inserted = true;
                } else{
                    // then just move on to the next node
                    previous_node = current_node;
                    current_node = current_node.next;
                }
            
            // found the place to insert (new node should be inserted before)
            } else if (span_cols > current_node.whamm_spansize){
                let new_node = new Node(current_node, live_injection.whamm_span, [live_injection], span_cols);
                
                // This means the new node is being inserted at the very beginning
                if (previous_node === null){
                    this.__head = new_node;
                } else {
                    previous_node.next = new_node
                }
                injection_inserted = true;
            }
        }
    }

    /* Getter and setters */

    get head(): Node {
        return this.__head;
    }

    set head(new_value: Node){
        this.__head = new_value;
    }
}

export class Node{
    next: Node | null;
    whamm_spansize: number;
    values: WhammLiveInjection[];
    whamm_span: span | null;

    constructor(next: Node| null , whamm_span: span | null, values: WhammLiveInjection[], span_size: number){
        this.next = next;
        this.whamm_span = whamm_span;
        this.values = values;
        this.whamm_spansize = span_size;
    }
}