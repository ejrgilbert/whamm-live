import { InjectType } from "./types";
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

    constructor(wat: string){
        this.wat_string = wat;
        this.current_index = this.func_id = 0;
        this.stack = [];
        this.popped_value = null;

        this.section_to_line_mapping = new Map();
        this.probe_mapping = new Map();
        this.local_mapping = new Map();
        this.func_mapping = new Map();
    }


}