import {FSM} from './fsm';
export class FSMHelper{
    // helper functions

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

    static get_word(instance: FSM): string{
        let word_regex = /[a-zA-Z]/;
        let chars : string[] = [];

        FSMHelper.consume_empty_spaces(instance);
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
