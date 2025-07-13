import fs from 'fs';
import path from 'path';
import toml from 'toml';
import {span, WatLineRange, WhammLiveInjection} from '../src/model/types';
import {ModelHelper} from '../src/model/utils/model_helper';
import {Cell, Node} from '../src/model/utils/cell';
import { Types } from '../src/whammServer';

const toml_file_path = path.resolve(__dirname, 'cell.test.toml'); 
describe('testing linked list implementation for a cell', () => {

        // Use random numbers to simulate the testing
        // Generate `x` random numbers as spansize and `add` them to the cell
        // After adding the injections to the cell,
        // sort those numbers in reverse from biggest span size to smallest with each element being a tuple of (value: # of times it got generated)
        // Now, we just need to check whether or not the linked list has the values inserted in the right order and the right number
        test('test the cell linked list `add` method', () => {
            let number_of_tests = 1;
            for (let i =0; i < number_of_tests; i++){
                let number_of_insertions = randomInteger(5, 20);
                
                // generate **that** many dummy live injections and add them to the cell
                let values : number[]= [];
                values.push(randomInteger(1, 5));
                const CELL = new Cell(create_dummy_whamm_live_injection(values[0]),values[0]);

                for (let j=1; j < number_of_insertions; j++){
                    let value = randomInteger(1, 5)
                    CELL.add(create_dummy_whamm_live_injection(value), value);
                    values.push(value);
                }

                // sort the `values` so that they are in reverse order in terms of spansize
                // and create a new array which keeps track of how many values are in the array
                let sorted_set_array = sort_values(values);
                let current_node : Node | null = CELL.head;
                for (let tuple_value of sorted_set_array){
                    let span_value = tuple_value[0];
                    let count = tuple_value[1];
                    if (current_node !== null){
                        expect(current_node.whamm_spansize).toBe(span_value);
                        expect(current_node.values.length).toBe(count);
                        current_node= current_node.next;
                    }
                }
                expect(current_node).toBe(null);
            }
        });
});

describe('testing whamm span size', () => {

  const config = toml.parse(fs.readFileSync(toml_file_path, 'utf-8'));
  for (let key of Object.keys(config)) {
    if (config[key]["test"] === "calculate_span_size"){
        test('test the span size value in columns', () => {

            // create valid span
            let lc0 = config[key]["lc0"];
            let lc1 = config[key]["lc1"];
            let span = {
                lc0: {l: lc0.l, c:lc0.c},
                lc1: {l: lc1.l, c:lc1.c},
            } as span;

            // create jagged array based on string contents
            let jagged_array = ModelHelper.create_jagged_array(config[key]["string_contents"]);
            let span_size = Node.calculate_span_size(span, jagged_array);
            expect(span_size).toBe(config[key]["span_size"]);
        });
}
}
});

// Helper functions

var create_dummy_whamm_live_injection = (span_size: number): WhammLiveInjection => {
    return {
        type: Types.WhammDataType.opProbeType,
        mode: null,
        code: [],
        wat_range: {l1: -1, l2: -1} as WatLineRange,
        whamm_span: {lc0: {l:1, c:1}, lc1: {l:1, c: span_size + 1}} as span
    } as WhammLiveInjection;
}

var randomInteger = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var sort_values = (values: number[]): [number, number][] => {
    const count_map = new Map<number, number>();
    // Count each value
    for (let val of values) {
        count_map.set(val, (count_map.get(val) || 0) + 1);
    }
    const result: [number, number][] = Array.from(count_map.entries());
    result.sort((a, b) => a[0] - b[0]).reverse();
    return result;
}