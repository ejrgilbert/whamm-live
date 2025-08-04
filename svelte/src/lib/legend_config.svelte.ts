let color_config_wasm = {"rgba(90, 150, 255, 0.3)": "Injected wat line"};
let color_config_wizard = {"rgba(90, 150, 255, 0.3)": "Whamm-injected logic: Code added due to user script instructions"};
let circle_config = {
    "red": "Op body probes",
    "blue": "locals",
    "green": "function probes"
}

export const legend_wasm_config = [color_config_wasm, circle_config];
export const legend_wizard_config = [color_config_wizard, {}];