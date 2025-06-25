import {FSM} from './fsm';
import { InjectType, stringToInjectType } from './types';

export class FSMHelper{
    // helper static methods for updating data(mapping) purposes

    static update_mappings(instance: FSM){
        // We only might need to update mappings for inject types with lower enum value
        // than the current one because of the section ordering
        let inj_type = stringToInjectType[instance.stack[instance.stack.length - 1]];
        let inj_types_less_than_current = Object.values(InjectType).filter(
            v => (v as number) < inj_type 
        )

        // do nothing if a mapping exists because there already exists a min line number mapped value
        for (let inj_type_less_than_current of inj_types_less_than_current){
            if (!instance.section_to_line_mapping.has(inj_type_less_than_current as number)){
                // @ts-ignore
                instance.section_to_line_mapping.set(inj_type_less_than_current, instance.current_line_number-1);
            }
        }
    }

    static update_function_state_mappings(instance: FSM){
        let line = instance.current_line_number;

        instance.func_mapping.set(instance.func_id, line);
        instance.local_mapping.set(instance.func_id, line + 1);

        let probe_map = instance.probe_mapping.get(instance.func_id);
        if (probe_map) probe_map[0] = line + 1;
    }

    // helper static methods for character consuming purposes

    static end_of_file(instance: FSM):boolean{
        return instance.current_index >= instance.wat_string.length;
    }

    static consume_empty_spaces(instance: FSM) {
        let space_regex = /\s/;
        while (instance.current_index < instance.wat_string.length &&
             space_regex.test(instance.wat_string[instance.current_index])){
                if (instance.wat_string[instance.current_index] === '\n') {
                    instance.current_line_number++;
                }
                instance.current_index++;
        }
    }

    // gets the next word and skips over empty spaces in the meantime
    static get_word(instance: FSM): string{
        let word_regex = /[a-zA-Z]/;
        let chars : string[] = [];

        if (!FSMHelper.end_of_file(instance)){
            // Expected '('
            if (instance.wat_string[instance.current_index] === '('){
                instance.current_index++;
                FSMHelper.consume_empty_spaces(instance);
                // get the next word
                while (instance.current_index < instance.wat_string.length &&
                    word_regex.test(instance.wat_string[instance.current_index])){
                        chars.push(instance.wat_string[instance.current_index++]);
                }
                FSMHelper.consume_empty_spaces(instance);
                return chars.join('');

            } else{
                throw new Error(`FSM parse error: Expected '(', got ${instance.wat_string[instance.current_index]}`)
            }
        } else{
            return '';
        }
    }
}
