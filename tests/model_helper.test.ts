import fs from 'fs';
import path from 'path';
import toml from 'toml';
import {ModelHelper} from '../src/model/utils/model_helper';
import {WhammLiveInjection, WatLineRange, span} from '../src/model/types';
import { Types } from '../src/whammServer';

const toml_file_path = path.resolve(__dirname, 'model_helper.test.toml'); 
// const error_toml_file_path = path.resolve(__dirname, 'model_helper_errors.test.toml'); 
const config = toml.parse(fs.readFileSync(toml_file_path, 'utf-8'));
  

describe('testing Model Helper `inject_wat` function', () => {

  for (let key of Object.keys(config)) {
    if (config[key]["test"] === "inject_wat"){

    test('test the injected wat content', () => {
      let original = config[key]["original"].join('\n');
      let number_of_lines_injected = config[key]["number_of_lines_injected"];
      let number_of_injections= config[key]["number_of_injections"];
      let whamm_injections : WhammLiveInjection[] = [];

      for (let i=0; i< number_of_injections; i++){
        let injection = config[key][`injection_${i+1}`];
        let whamm_live_injection = {
          // type and whamm doesn't matter
          type: Types.WhammDataType.opProbeType,
          code: injection["code"],
          mode: null,
          wat_range: {l1: injection.range[0], l2: injection.range[1]},
          whamm_span: null
        } as WhammLiveInjection
        whamm_injections.push(whamm_live_injection)

      }

      expect(ModelHelper.inject_wat(original, whamm_injections, number_of_lines_injected)).toMatchObject(
        config[key]["expected"]
      );

    });
  }
}
});

describe('testing Model Helper\'s static `create_jagged_array` method', () => {

  for (let key of Object.keys(config)) {
    if (config[key]["test"] === "create_jagged_array"){

    test('test the jagged array dimensions', () => {
      let content: string= config[key]["content"];
      let number_of_rows: number = config[key]["number_of_rows"];
      let number_of_cols: number[] = config[key]["number_of_cols"];
      let jagged_array= ModelHelper.create_jagged_array(content);

      expect(jagged_array.length).toBe(number_of_rows);
      for (let i=0; i < number_of_cols.length; i++){
        expect(jagged_array[i].length).toBe(number_of_cols[i]);
      }
    });
  }
}
});

describe('testing Model Helper\'s static `__new_whamm_live_injection_instance` method', () => {
      
      // the injection type doesn't matter for this static method
      test('test the whamm live injection instance static method for func probes', () => {
        // @ts-ignore
        let whamm_cause: Types.WhammCause = {"_tag": "userProbe", "_value": {"lc0": {"l": 1,"c": 1}, "lc1": { "l": 4, "c": 2}}}
        let func_record = {cause: whamm_cause, targetFid: 2, body:[], mode: Types.FuncInstrumentationMode.entry} as Types.FuncProbeRecord

        let whamm_live_instance = ModelHelper.__new_whamm_live_injection_instance(func_record, Types.WhammDataType.funcProbeType, 10);
        expect(whamm_live_instance).toStrictEqual(
          {
            type: Types.WhammDataType.funcProbeType,
            mode: null,
            code: [],
            wat_range: {l1: 10, l2: 10} as WatLineRange,
            whamm_span: {"lc0": {"l": 1,"c": 1}, "lc1": { "l": 4, "c": 2}} as span,
          }
        )
      });
  }
);

describe('testing whamm span', () => {

  for (let key of Object.keys(config)) {
    if (config[key]["test"] === "calculate_span_values_and_size"){
        test('test the span size and line-col values', () => {

            // create valid span
            let lc0 = config[key]["lc0"];
            let lc1 = config[key]["lc1"];
            let span = {
                lc0: {l: lc0.l, c:lc0.c},
                lc1: {l: lc1.l, c:lc1.c},
            } as span;

            // create jagged array based on string contents
            let jagged_array = ModelHelper.create_jagged_array(config[key]["string_contents"]);
            let span_size = ModelHelper.calculate_span_size(span, jagged_array);
            expect(span_size).toBe(config[key]["span_size"]);

            // get the line-col values
            let recieved_line_col_values = ModelHelper.get_line_col_values(span, jagged_array);

            // Build the expected line-col values and check whether it is as expected
            let line_col_config = config[key]["line_col_values"];
            let expected_line_col_values : [number, number][]= []
            for (const [key, value] of Object.entries(line_col_config)){
              let line: number = parseInt(key);
              let col_range : [number, number] = value as [number, number];

              for (let col=col_range[0]; col< col_range[1]; col++){
                expected_line_col_values.push([line, col]);
              }
            }

            expect(recieved_line_col_values).toMatchObject(expected_line_col_values);
        });
      }
    }
});
