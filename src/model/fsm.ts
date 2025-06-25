import { InjectType } from "./types";

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
class FSM{
    // Stack values
    stack: string[];
    popped_value : string | null;

    // wat file related variables
    current_index: number;
    wat_string: string;
    func_id : number;

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
        this.stack = [];
        this.popped_value = null;

        this.current_state = State.start_state;

        this.section_to_line_mapping = new Map();
        this.probe_mapping = new Map();
        this.local_mapping = new Map();
        this.func_mapping = new Map();
    }   

    run(){

        
    }

    // Function handler for each state so that we can perform actions 
    // and transition to the next state
    private static start_state_method(instance: FSM){

    }

    private static main_state_method(instance: FSM){

    }

    private static default_state_method(instance: FSM){

    }

    private static function_state_method(instance: FSM){

    }

    private static local_state_method(instance: FSM){

    }

}
