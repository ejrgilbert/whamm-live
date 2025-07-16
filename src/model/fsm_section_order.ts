import { InjectType, stringToInjectType } from "./types";
import { FSMHelper, stack_value } from "./utils/fsm_helper";

enum State{
    start_state, // qo
    main_state, // q1
    default_state, // q2
    function_state, // q3
    local_state, // q4
    null_state,
}

class FSMSectionReorder{

}