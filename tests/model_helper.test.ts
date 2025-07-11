import fs from 'fs';
import path from 'path';
import toml from 'toml';
import {ModelHelper} from '../src/model/utils/model_helper';
import {WhammLiveInjection, WatLineRange, span} from '../src/model/types';
import { Types } from '../src/whammServer';
import { FSM } from '../src/model/fsm';

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

/*
  Integration testing for `create_whamm_live_injection_instances` method
  Will test a bunch of helper methods together:
    1. `create_whamm_data_type_to_whamm_injection_mapping` method tested
    2. `update_fsm_funcIDs` method tested
    3. And finally, `create_whamm_live_injection_instances` method tested
*/
describe('testing Model Helper\'s static `create_whamm_live_injection_instances` method', () => {
      
  for (let key of Object.keys(config)) {
    if (config[key]["test"] === "create_whamm_live_injection_instances"){
      test('test the **main** create_whamm_live_injection_instances static method', () => {
        
        // load the FSM
        const wat_file_path = path.resolve(__dirname, 'wat', config[key]["app"]); 
        let fsm = new FSM(fs.readFileSync(wat_file_path, 'utf-8'));
        fsm.run();

        // Test whether the mappings are as expected for each inject type
        let data: Types.InjectionPair[]= load_whamm_api_response(config[key].app, config[key].script)
        let injection_mappings = ModelHelper.create_whamm_data_type_to_whamm_injection_mapping(data);
        // Initially test that all the mappings are as expected
        for (let injection_mapping of injection_mappings){
          for (let injection of injection_mapping[1]){
            expect(injection.dataType).toBe(injection_mapping[0]);
          }
        }

        /*
         Check for injected FSM funcID values
        */
        let injected_fsm = ModelHelper.update_fsm_funcIDs(fsm, injection_mappings);
        let import_functions_injected = config[key]["number_of_import_functions_injected"];
        type FSMKey = keyof FSM;

        // test for local_mapping, probe_mapping and func_mapping only since these are the only ones
        // that need to have their funcID updated
        let mappings: FSMKey[] = ["local_mapping", "probe_mapping", "func_mapping"];
        for (let mapping of mappings){
          let map = fsm[mapping];
          let new_map = injected_fsm[mapping];

          if (map instanceof Map && new_map instanceof Map){
            for (const [old_funcid, value] of map.entries()){
              expect(value).toBe(new_map.get(old_funcid + import_functions_injected));
            }
          }
        }


        // Create the whamm live injection object instances
        // let [one, two ] = ModelHelper.create_whamm_live_injection_instances(fsm, injection_mappings)
      });
  }
  }
});

// Test helper methods
function load_whamm_api_response(app_name: string, script: string): Types.InjectionPair[]{
  const response_file_path = path.resolve(__dirname, 'whamm_api_responses',script.split('.')[0], `${app_name.split('.')[0]}.json`); 
  let file_string = fs.readFileSync(response_file_path, 'utf-8')
  const data = JSON.parse(file_string);
  return data;
}