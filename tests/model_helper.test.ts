import fs from 'fs';
import path from 'path';
import toml from 'toml';
import {ModelHelper} from '../src/model/utils/model_helper';
import {WhammLiveInjection, WatLineRange} from '../src/model/types';
import { Types } from '../src/whammServer';
import { isNumberObject } from 'util/types';

const toml_file_path = path.resolve(__dirname, 'model_helper.test.toml'); 
// const error_toml_file_path = path.resolve(__dirname, 'model_helper_errors.test.toml'); 

describe('testing Model Helper `inject_wat` function', () => {

  const config = toml.parse(fs.readFileSync(toml_file_path, 'utf-8'));
  
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
          wat_range: {l1: injection.range[0], l2: injection.range[1]},
          whamm_span: undefined
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

  const config = toml.parse(fs.readFileSync(toml_file_path, 'utf-8'));
  
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
