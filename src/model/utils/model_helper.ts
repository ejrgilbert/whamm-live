import { WhammLiveInjection } from "../types";

export class ModelHelper{

    // Inject wat builds the injected wat content
    // by combining the original wat string and the whamm_injections
    static inject_wat(original: string, whamm_injections: WhammLiveInjection[], number_of_lines_injected: number) :string[]{

        let lines = original.split('\n');
        let injected_wat = new Array(lines.length + number_of_lines_injected);

        for (let whamm_injection of whamm_injections){
            for (let i =whamm_injection.range.l1; i <= whamm_injection.range.l2; i++){
                injected_wat[i-1] = whamm_injection.code[i - whamm_injection.range.l1];
            }
        }
        
        let index = 0;
        for (let i=0; i < injected_wat.length; i++){
            if (injected_wat[i] == undefined && lines[index]?.length > 0){
                injected_wat[i] = lines[index++]
            }
        }
        return injected_wat;
    }
}