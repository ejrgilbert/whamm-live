/**
 * @see https://github.com/ejrgilbert/whamm-live/issues/15
 * @remarks Look at the state machine for this with the link above
 * */ 

import { InjectType, sectionNamesInOrder, stringToInjectType } from "./types";
import { FSMHelper, stack_value } from "./utils/fsm_helper";

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
    private current_state: State;
    private wat_sections: Record<string, string[]>;

    static state_to_method_mapping: Record<State, (arg0: FSMSectionReorder) => void > = {
        [State.module_state]: FSMSectionReorder.module_state_method,
        [State.main_state]: FSMSectionReorder.main_state_method,
        [State.consume_state]: FSMSectionReorder.consume_state_method,
        // the value function will never be executed
        [State.null_state]: ()=>{},
    }

    constructor(wat_contents: string){
        this.current_index = 0;
        this.wat_string = wat_contents;
        this.current_state = State.module_state;

        this.wat_sections = {};
        // Section ordering is preserved
        for (let section of Object.values(sectionNamesInOrder)){
            this.wat_sections[section] = [];
        }
    }

    run(){
       while (!FSMHelper.end_of_file(this) && this.current_state !== State.null_state){
            // call the function for the required state
            FSMSectionReorder.state_to_method_mapping[this.current_state](this);
       }
    }

    // Every state has its own method

    private static module_state_method(){
        /** 
         * @todo
         * */

    }

    private static main_state_method(){
        /** 
         * @todo
         * */

    }

    private static consume_state_method(){
        /** 
         * @todo
         * */

    }
}