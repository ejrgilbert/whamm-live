/// VVIP ::: TWO BIG ASSUMPTIONS
    // We assume that the wat content is ordered in sections in the following order : type, import, table, memory, tag, global ,export, elem, func, data
    // We assume that the wat content doesn't fold expressions
///

import { InjectType, stringToInjectType } from "./types";
import { FSMHelper, stack_value } from "./fsm_helper";

// Consider looking at https://github.com/ejrgilbert/whamm-live/issues/12 to
// We have 5 states in our FSM: start_state, main_state, function_state, local_state, default_state, null_state
enum State{
    start_state, // qo
    main_state, // q1
    default_state, // q2
    function_state, // q3
    local_state, // q4
    null_state,
}

// Finite state machine code implementation for mapping inject types to wasm line
export class FSM{
    // Stack values
    stack: stack_value[];
    popped_value : stack_value | undefined;

    // wat file related variables
    current_index: number;
    wat_string: string;
    func_id : number;
    current_line_number : number;

    // different types of mappings
    // Mapping for all the following types: type, import, table, memory, tag, global, export, elem, func, data
    section_to_line_mapping : Map<InjectType, number>;

    // probe mapping from funcID to (opcode starting line, opcode ending line)
    probe_mapping : Map<number, [number, number]>;
    // local mapping from funcID to line where locals can be injected 
    local_mapping : Map<number, number>;
    // func mapping from funcID to line where func probes(entry, exit modes) can be injected 
    func_mapping : Map<number, number>;
    
    // state related variables
    current_state: State;
    static state_to_method_mapping: Record<State, (arg0: FSM) => void > = {
        [State.start_state]: FSM.start_state_method,
        [State.main_state]: FSM.main_state_method,
        [State.default_state]: FSM.default_state_method,
        [State.function_state]: FSM.function_state_method,
        [State.local_state]: FSM.local_state_method,
        // the value function will never be executed
        [State.null_state]: ()=>{},
     }

    constructor(wat: string){
        this.wat_string = wat;
        this.current_index = this.func_id = 0;
        this.current_line_number = 1;
        this.stack = [];
        this.popped_value = undefined;

        this.current_state = State.start_state;

        this.section_to_line_mapping = new Map();
        this.probe_mapping = new Map();
        this.local_mapping = new Map();
        this.func_mapping = new Map();
    }   

    run(){
       while (!FSMHelper.end_of_file(this) && this.current_state !== State.null_state){
            // call the function for the required state
            FSM.state_to_method_mapping[this.current_state](this);
       }
    }

    // Function handler for each state so that we can perform actions 
    // and transition to the next state
    private static start_state_method(instance: FSM){
        // will skip over empty spaces and will return me the required word only
        FSMHelper.consume_empty_spaces(instance);
        let inject_type : string = FSMHelper.get_word(instance);

        if (inject_type == 'module'){
            instance.stack.push(FSMHelper.wrap_stack_value(instance, inject_type));
            FSMHelper.consume_until('(', instance);
            instance.current_state = State.main_state;
        }
        else throw new Error("FSM parse Error: Expected 'module'!");
    }

    private static main_state_method(instance: FSM){
        FSMHelper.consume_empty_spaces(instance);

        // Handle '(' case
        if (FSMHelper.get_char(instance) == '('){

            FSMHelper.consume_empty_spaces(instance);
            let inject_type : string = FSMHelper.get_word(instance);

            if (Object.keys(stringToInjectType).includes(inject_type)){
                // push the value on the stack
                instance.stack.push(FSMHelper.wrap_stack_value(instance, inject_type));
                // check if tos == instance.popped_value
                // if they aren't the same, it means we are in a new wasm section
                // so we need to update the appropriate mappings
                if (instance.popped_value?.value != instance.stack[instance.stack.length - 1].value){
                    FSMHelper.update_mappings(instance);
                }

                // Handle `func` seperately
                if (inject_type == 'func'){
                    FSMHelper.update_function_state_mappings(instance);
                    instance.current_state = State.function_state;

                } else {
                    instance.current_state = State.default_state;
                }

            } else {
                if (FSMHelper.get_char(instance) == '@') {
                    FSMHelper.update_mappings(instance);
                    // handle stuff like "@custom" and "@producers"
                    FSMHelper.consume_until_closing_parenthesis(instance);
                    instance.current_index++;
                    // stay in main state
                    instance.current_state = State.main_state;

                } else if (inject_type == 'start'){
                    // treat it like an `elem` because the mappings will stay the same
                    instance.stack.push(FSMHelper.wrap_stack_value(instance, 'elem'));
                    FSMHelper.update_mappings(instance);
                    instance.current_state = State.default_state;

                } else{
                    throw new Error(`Unexpected keyword, got ${FSMHelper.get_word(instance)}`);
                }
            }
        
        // Handle ')' case
        } else if (FSMHelper.consume_char(instance) == ')'){
            FSMHelper.update_mappings(instance);
            // module gets popped
            instance.popped_value = instance.stack.pop();
            if (instance.popped_value) instance.popped_value.end_line= instance.current_line_number;
            instance.current_state = State.null_state;
        } else{
            throw new Error(`FSM parse Error: Expected '(' or ')'!`);
        }
    }

    private static default_state_method(instance: FSM){
        FSMHelper.consume_empty_spaces(instance);
        FSMHelper.consume_until_closing_parenthesis(instance);
        // check if ')' is there
        if (FSMHelper.consume_char(instance) === ')'){
            instance.popped_value = instance.stack.pop();
            if (instance.popped_value) instance.popped_value.end_line= instance.current_line_number;
            instance.current_state = State.main_state;
        } else{
            throw new Error("FSM parse error: ')' expected while moving into main state")
        }
    }

    private static function_state_method(instance: FSM){
        FSMHelper.consume_empty_spaces(instance);
        // check for potential names
        if (FSMHelper.get_char(instance) == '$'){
            // consume until whitespace or ')' 
            let word = FSMHelper.consume_until_whitespace_or(instance, ")");
            FSMHelper.consume_empty_spaces(instance);
        }

        // handle any potential locals and other stuff like params and result
        if (FSMHelper.get_char(instance) === '('){
            if (FSMHelper.get_word(instance) == 'local'){
                instance.current_state = State.local_state;
            } else{
                FSMHelper.consume_until_closing_parenthesis(instance);
                instance.current_index++;
                // recursive calling
                FSM.function_state_method(instance);
                return;
            }
        // consume characters until the ending parenthesis
        } else{
            // update the mapping(s)

            // update local mapping first
            if (!instance.local_mapping.get(instance.func_id)){
                let local_mapping_value = instance.current_line_number;
                if (local_mapping_value != instance.func_mapping.get(instance.func_id))
                    local_mapping_value--;
                instance.local_mapping.set(instance.func_id, local_mapping_value);
            }

            let probe_map = instance.probe_mapping.get(instance.func_id);
            if (probe_map === undefined) instance.probe_mapping.set(instance.func_id, [instance.current_line_number, -1]);

            FSMHelper.consume_until_closing_parenthesis(instance);
            instance.current_index++;

            // update the mapping
            probe_map = instance.probe_mapping.get(instance.func_id);
            if (probe_map) probe_map[1] = instance.current_line_number;

            instance.func_id++;

            instance.popped_value = instance.stack.pop();
            if (instance.popped_value) instance.popped_value.end_line= instance.current_line_number;

            instance.current_state = State.main_state;

            FSMHelper.consume_empty_spaces(instance);
        }
    }

    private static local_state_method(instance: FSM){
        FSMHelper.consume_until_closing_parenthesis(instance);
        instance.current_index++;
        instance.local_mapping.set(instance.func_id, instance.current_line_number);
        instance.current_state = State.function_state;
    }

}