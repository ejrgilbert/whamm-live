<script lang="ts">
    import { onDestroy, onMount } from "svelte";

    var observer: MutationObserver;

    // content here should be array of all the bytes for our wasm file
    let { view, probe_data } = $props();
    const load_html = function(node: HTMLElement){
        // Remove focus highlight
        if (view) document.getElementById("wasm-webview-code-editor")?.appendChild(view.dom);
        observer = setup_mutation_observer();
    }

    var probe_data_update_function: (event:MessageEvent) => void;

    onMount(()=>{
        probe_data_update_function = (event:MessageEvent) =>{
            let message = event.data;
            switch(message.command){
                case 'highlight':
                {
                    // reset any existing highlights
                    display_data(true);
                    probe_data=message.data;
                    display_data();
                }
                break;
            }
        };
       window.addEventListener("message", probe_data_update_function);
    });

    onDestroy(()=>{
        window.removeEventListener("message", probe_data_update_function);
        observer.disconnect();
    });

    // Function that displays the data
    var display_data = (reset: boolean = false)=>{
        if (probe_data){
            // Show the highlight if probe data is not null
            for (let line of probe_data[1]){
                let div = (document.querySelectorAll(".cm-line")[line] as HTMLElement);
                div.style.background = (reset) ? '' : 'cadetblue';
            }
        }
    }

    function setup_mutation_observer(): MutationObserver{

        let debounce = (callback: Function, delay: number)=>{
            let timer : number;
            return function() {
                clearTimeout(timer);
                // @ts-ignore
                timer = setTimeout(() => {
                    callback();
                }, delay);
            }
        }

        let target = document.querySelector("#wasm-webview-code-editor");
        // Options for the observer (which mutations to observe)
        const config = { attributes: true, subtree: true};

        // Callback function to execute when mutations are observed
        const callback_mutation_observer = () => {
            // disconnect mutation observer to update data
            observer.disconnect();
            console.log('finally executing right');
            display_data();
            // reconnect
            if (target) observer.observe(target, config);
        };

        
        let actual_callback = debounce(callback_mutation_observer, 500);
        const callback = (mutationList: MutationRecord[], observer: MutationObserver) => {
            actual_callback();
        };


        // Create an observer instance linked to the callback function
        const observer = new MutationObserver(callback);

        // Start observing the target node for configured mutations
        if (target) {observer.observe(target, config);}
        return observer;
    }

</script>

<div use:load_html id="wasm-webview-code-editor"></div>
<style>
    div{
        width: 90%;
        margin: auto;
    }
</style>
