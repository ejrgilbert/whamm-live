/**
 * @see https://github.com/ejrgilbert/whamm-live/issues/15
 * @remarks Look at the state machine for this with the link above
 * */ 

import { sectionNamesInOrder } from "./types";
import { FSMHelper } from "./utils/fsm_helper";

type stack_value = {
    section_name: string,
    start_index: number,
}

enum State{
    module_state, // qo
    main_state, // q1
    consume_state, // q2
    null_state
}

export class FSMSectionReorder{
    // state related variables
    current_index: number;
    wat_string: string;
    new_wat!: string;

    private current_state: State;
    private wat_sections: Record<string, string[]>;
    private section_stack: stack_value[] = [];
    private module_name: string | undefined;

    static state_to_method_mapping: Record<State, (arg0: FSMSectionReorder) => void > = {
        [State.module_state]: FSMSectionReorder.module_state_method,
        [State.main_state]: FSMSectionReorder.main_state_method,
        [State.consume_state]: FSMSectionReorder.consume_state_method,
        // the value function will never be executed
        [State.null_state]: ()=>{},
    }
    private static section_names: string[]= Object.values(sectionNamesInOrder);

    constructor(wat_contents: string){
        this.current_index = 0;
        this.wat_string = wat_contents;
        this.current_state = State.module_state;

        this.wat_sections = {};
        // Section ordering is preserved
        for (let section of FSMSectionReorder.section_names){
            this.wat_sections[section] = [];
        }
    }

    run(){
       while (!FSMHelper.end_of_file(this) && this.current_state !== State.null_state){
            // call the function for the required state
            FSMSectionReorder.state_to_method_mapping[this.current_state](this);
       }
        this.build_new_wat();
    }

    private build_new_wat(){
        let new_wat = [(this.module_name) ? `(module $${this.module_name}` : "(module"]
        for (let section of FSMSectionReorder.section_names){
            for (let each of this.wat_sections[section]){
                new_wat.push(`  ${each}`);
            }
        }
        new_wat.push(")");
        this.new_wat = new_wat.join('\n');
    }

    // Every state has its own method

    // Start state until components are supported
    private static module_state_method(instance: FSMSectionReorder){
        FSMHelper.consume_empty_spaces(instance);

        switch (FSMHelper.get_char(instance)){
            case '(':
                {
                    let start_index = instance.current_index;
                    let inject_type : string = FSMHelper.get_word(instance);
                    if (inject_type === "module"){
                        instance.module_name = FSMHelper.get_module_name(instance);
                        instance.section_stack.push(
                            {section_name: inject_type, start_index: start_index});

                        // transition to `main_state`
                        instance.current_state = State.main_state;
                        break;
                    }

                    // fall through if not "module"
                }
            default:
                throw new Error("FSM parse error: Expected `module` at the start of target wat");
        }

    }

    private static main_state_method(instance: FSMSectionReorder){
        FSMHelper.consume_empty_spaces(instance);
        switch (FSMHelper.get_char(instance)){
            case '(':
                {
                    let start_index = instance.current_index;
                    let section_name : string = FSMHelper.get_word(instance);

                    if (!FSMSectionReorder.section_names.includes(section_name)){
                        if (FSMHelper.get_char(instance) == '@') {
                            section_name = "custom";
                        } else{
                            throw new Error(`FSM reorder error: Unsupported section name: ${section_name}`)
                        }
                    }

                    instance.section_stack.push(
                                {section_name: section_name, start_index: start_index});
                    instance.current_state = State.consume_state;
                }
                break;
            case ')':
                {
                    // it should **only** be the module section on top of the stack
                    let value = instance.section_stack.pop();
                    if (!value || value.section_name !== "module" || instance.section_stack.length !== 0) throw new Error("FSM reorder error: Expected only module on stack."); 
                    instance.current_index++;
                    instance.current_state = State.null_state;
                }
                break;
        }
    }

    private static consume_state_method(instance: FSMSectionReorder){
        // consume until the closing ')'
        let expected_section = instance.section_stack[instance.section_stack.length-1];
        FSMHelper.consume_until_closing_parenthesis(instance);
        switch (FSMHelper.get_char(instance)){
            case ')':
                {
                    // pop the value off the stack 
                    let recieved_section = instance.section_stack.pop();
                    if (expected_section !== recieved_section) throw new Error(`FSM reorder error: Expected end of ${expected_section.section_name}, got end for ${recieved_section?.section_name}`)
                    if (instance.section_stack.length !== 1) throw new Error(`FSM reorder error: Expeced only module to be on stack, but that isn't the case`)

                    // store this section's span in its respective array
                    let end_index = instance.current_index+1;
                    let section_array = instance.wat_sections[expected_section.section_name];
                    section_array.push(
                        instance.wat_string.slice(expected_section.start_index,end_index));

                    // Transition back to main state
                    instance.current_index++;
                    instance.current_state = State.main_state;
                }
                break;
            default:
                throw new Error(`FSM reorder error: Expected end of section ${instance.section_stack[instance.section_stack.length-1]}`)
        }
    }
}