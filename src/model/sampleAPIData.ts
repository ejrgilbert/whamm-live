import { WhammResponse, ScriptLoc, Probe, ModeKind, InjectType } from "./types";

// Sample example response
const sample_whamm_api_response : WhammResponse = {
    error: undefined,
    response: new Map(),
}

let get_script_loc = (a: number, b: number): ScriptLoc =>{
    let x : ScriptLoc = {l: a, c:b};
    return x;
}

// @ts-ignore
let createProbes = ():Probe[] => {
    let probe1 : Probe = {
        target_fid: 0,
        target_opcode_idx: 2,
        mode: ModeKind.before,
        body: ["i32.const 10\ni32.const 10\ni32.sub"],
        metadata: {
            script_start: get_script_loc(5,10),
            script_end: get_script_loc(5,20),
        }
    }

    let probe2 : Probe = {
        target_fid: 1,
        target_opcode_idx: 5,
        mode: ModeKind.before,
        body: ["i32.const 10\ni32.const 10\ni32.add"],
        metadata: {
            script_start: get_script_loc(10,0),
            script_end: get_script_loc(10,20),
        }
    }

    return [probe1, probe2];
}

if (sample_whamm_api_response) sample_whamm_api_response.response?.set(InjectType.FuncBodyProbe, createProbes());

// Sample example error response
const sample_whamm_api_error_response: WhammResponse = {
    response: undefined,
    error: [
        {
        msg: "ERROR HERE",
        err_loc: {
            script_start: get_script_loc(10,0),
            script_end: get_script_loc(10,6)
        }},{
        msg: "ERROR HERE TOO",
        err_loc: {
            script_start: get_script_loc(15,0),
            script_end: get_script_loc(15,6)
        }},
    ]
}

export {sample_whamm_api_response, sample_whamm_api_error_response};
