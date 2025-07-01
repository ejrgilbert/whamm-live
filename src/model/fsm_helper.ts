import {FSM} from './fsm';
import { InjectType, stringToInjectType } from './types';

export class FSMHelper{
    // helper static methods for updating data(mapping) purposes

    static update_mappings(instance: FSM){
        // We only might need to update mappings for inject types with lower enum value
        // than the current one because of the section ordering
        let inject = instance.stack[instance.stack.length - 1];
        let inj_type = stringToInjectType[inject.value];

        let inj_types_less_than_current = Object.values(InjectType).filter(
            v => (v as number) < inj_type 
        )

        // do nothing if a mapping exists because there already exists a min line number mapped value
        for (let inj_type_less_than_current of inj_types_less_than_current){
            if (!instance.section_to_line_mapping.has(inj_type_less_than_current as number)){
                let line_value;
                if (instance.popped_value !== undefined){
                    line_value = instance.popped_value.end_line;
                } else{
                    line_value = Math.max(1, instance.current_line_number -1);
                }
                // @ts-ignore
                instance.section_to_line_mapping.set(inj_type_less_than_current, line_value);
            }
        }
    }

    static update_function_state_mappings(instance: FSM){
        let line = instance.current_line_number;
        instance.func_mapping.set(instance.func_id, line);
    }

    // helper static methods for character consuming purposes

    static end_of_file(instance: FSM):boolean{
        return instance.current_index >= instance.wat_string.length;
    }

    static consume_empty_spaces(instance: FSM) {
        let space_regex = /\s/;
        while (instance.current_index < instance.wat_string.length &&
             space_regex.test(FSMHelper.get_char(instance))){
                if (FSMHelper.consume_char(instance) === '\n') {
                    instance.current_line_number++;
                }
        }
    }

    static get_char(instance: FSM): string{
        if (!FSMHelper.end_of_file(instance)){
            return instance.wat_string[instance.current_index];
        } else return '\0'
    }

    static consume_char(instance: FSM): string{
        let char = FSMHelper.get_char(instance);
        instance.current_index++;
        return char;
    }

    // gets the next word and skips over empty spaces in the meantime
    static get_word(instance: FSM): string{
        FSMHelper.consume_empty_spaces(instance);
        let word_regex = /[a-zA-Z]/;
        let chars : string[] = [];

        if (!FSMHelper.end_of_file(instance)){
            // Expected '('
            if (FSMHelper.get_char(instance) === '('){
                instance.current_index++;
                FSMHelper.consume_empty_spaces(instance);
                // get the next word
                while (instance.current_index < instance.wat_string.length &&
                    word_regex.test(FSMHelper.get_char(instance))){
                        chars.push(FSMHelper.consume_char(instance));
                }
                FSMHelper.consume_empty_spaces(instance);
                return chars.join('');

            } else{
                throw new Error(`FSM parse error: Expected '(', got ${FSMHelper.get_char(instance)}`)
            }
        } else{
            return '';
        }
    }

    // consumes UPTO the closing parenthesis but not the closing parenthesis itself
    static consume_until_closing_parenthesis(instance: FSM, string_handling: boolean = true){
        let closing_parentheses_found = false;
        let number_of_parentheses = 1;

        while (!FSMHelper.end_of_file(instance) && !closing_parentheses_found){
            switch(FSMHelper.get_char(instance)){

                case '"':
                case "'":
                {
                    instance.current_index++;
                    if (string_handling){
                        FSMHelper.consume_until_string_ends(instance.wat_string[instance.current_index-1], instance);
                        instance.current_index++;
                    }
                }
                    break;
                
                case '(':
                    number_of_parentheses++;
                    instance.current_index++;
                    break;

                case ')':
                    number_of_parentheses--;
                    if (number_of_parentheses == 0) closing_parentheses_found=true;
                    else instance.current_index++;
                    break;
                
                // fall through
                case '\n':
                    instance.current_line_number++;
                default:
                    instance.current_index++;
                    break;
            }
        }

    }

    static consume_until(char: string, instance: FSM){
        while (!FSMHelper.end_of_file(instance) &&
            FSMHelper.get_char(instance) !== char){
                    instance.current_index++;
        }
    }

    static consume_until_string_ends(char: string, instance: FSM){
        let closing_char_found = false;
        while (!FSMHelper.end_of_file(instance) && !closing_char_found){
            switch(FSMHelper.get_char(instance)){
                case '"':
                case "'":
                    {
                        let this_char = FSMHelper.get_char(instance);
                        if (this_char != char){
                            instance.current_index++;
                        } else{
                            // check if previous character is '\'
                            if (instance.wat_string[instance.current_index-1] != '\\')
                                closing_char_found = true;
                            else
                                instance.current_index++;
                        }
                    }
                    break;

                default:
                    instance.current_index++;
                    break;
            }
        }
    }

    static consume_until_whitespace_or(instance:FSM, char: string){
        let space_regex = /\s/;
        while (!FSMHelper.end_of_file(instance) &&
             !space_regex.test(FSMHelper.get_char(instance)) &&
            FSMHelper.get_char(instance) !== char){
                    instance.current_index++;
        }
    }

    static consume_until_whitespace(instance:FSM){
        let space_regex = /\s/;
        while (!FSMHelper.end_of_file(instance) &&
             !space_regex.test(FSMHelper.get_char(instance))){
                    instance.current_index++;
        }
    }


    // stack value wrappers
    static wrap_stack_value(instance: FSM, value: string): stack_value{
        return {
            value: value,
            start_line: instance.current_line_number,
            end_line: -1,
        }
    }
}

export type stack_value= {
    value: string,
    start_line: number,
    end_line: number,
}