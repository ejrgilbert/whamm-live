<script lang="ts">
    function get_file_name(file_path: string){
        let file_path_array = file_path.split('/');
        return file_path_array[file_path_array.length -1];
    }
    import { Jumper } from 'svelte-loading-spinners';

    // Reactive variables
    // Array of [wasm file, api is out of date or not]
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

<div id="footer">
    <hr style="border-color:grey;">
    {#each api_values as api_value}
        <div class="container">
        {#if api_value[1]}
            <div class="flex-item">
            <Jumper size="15" duration="2s" />
            </div>
            <div class="flex-item">
                <p>Updating API for {get_file_name(api_value[0])}</p>
            </div>
        {:else} 
            <div class="flex-item">
                <p>✅</p>
            </div>
            <div class="flex-item">
                <p>API updated for {get_file_name(api_value[0])}</p>
            </div>
        {/if}
        </div>
    {/each}
</div>

<style>
#footer {
    position: fixed;
    bottom: 0;
    width: 100%;
}

.container{
    color: grey;
    display: flex;
}

.flex-item{
    flex-grow: 1;
    opacity: 70%;
}
</style>

