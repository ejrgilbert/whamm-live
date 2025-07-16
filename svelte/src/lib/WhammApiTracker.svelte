<script lang="ts">
    function get_file_name(file_path: string){
        let file_path_array = file_path.split('\\');
        return file_path_array[file_path_array.length -1];
    }

    // Reactive variables
    // Array of [wasm file, api is uptodate or not]
    let api_values: [string, boolean][]= $state([]);

    // event listener to update html on change to workspace data
    window.addEventListener("message" , (event)=>{
            const message = event.data;
            if (message) {
                if (message.command == 'whamm-api-models-update'){
                    api_values = message.values;
                }
            }
    });

</script>

{#each api_values as api_value}
<p>File name: {get_file_name(api_value[0])} Out-of-date: {api_value[1]}</p>
{/each}

<style>
</style>

