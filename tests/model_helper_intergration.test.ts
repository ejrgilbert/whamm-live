import fs from 'fs';
import path from 'path';
import {ModelHelper} from '../src/model/utils/model_helper';
import { Types } from '../src/whammServer';
import { FSM } from '../src/model/fsm';
import toml from 'toml';
import { InjectionRecord, WhammLiveInjection } from '../src/model/types';

const toml_file_path = path.resolve(__dirname, 'model_helper.test.toml'); 
const config = toml.parse(fs.readFileSync(toml_file_path, 'utf-8'));

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
      test('integration testing for model helper', () => {
        
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
        let response = ModelHelper.create_whamm_live_injection_instances(injected_fsm, injection_mappings)
        // test the injections and whether their wat ranges are what we expect
        // validate_whamm_live_injection_instances(injected_fsm, injection_mappings, ...response)

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

function validate_whamm_live_injection_instances(injected_fsm: FSM, injection_mappings: Map<string, Types.WhammInjection[]>, whamm_live_instances_to_inject: WhammLiveInjection[], whamm_live_instances_to_not_inject: WhammLiveInjection[], lines_injected: number){
    // validate in section order
    let injection_index = 0;
    let lines_injected_counter = 0;

    for (let inject_type of
        [Types.WhammDataType.typeType, Types.WhammDataType.importType, Types.WhammDataType.tableType, Types.WhammDataType.memoryType, Types.WhammDataType.globalType, Types.WhammDataType.exportType,
        Types.WhammDataType.elementType]){
            let mapping = injection_mappings.get(inject_type);
            if (mapping){
                for (let inj of mapping){
                    let whamm_live_instance = whamm_live_instances_to_inject[injection_index++];
                    let record = inj.typeData;
                    if (record === undefined) throw new Error("Failed to validate whamm live injection instance because injection type is different than expected");

                    compare_whamm_live_instance_and_whamm_injection(whamm_live_instance, inj.dataType, record, injected_fsm);
                }
            }
    }
}

function compare_whamm_live_instance_and_whamm_injection(whamm_live_instance: WhammLiveInjection, inj_type: Types.WhammDataType, record: InjectionRecord | undefined, fsm: FSM){
    expect(whamm_live_instance.type).toBe(inj_type);
}