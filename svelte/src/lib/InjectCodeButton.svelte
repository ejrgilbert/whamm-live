<script>
    import { fade } from "svelte/transition";
    import { api_response, config} from "./api_response.svelte";

    const { callback } = $props();

// @todo: button- nothing injected for wizard!!!!!
</script>
{#if !api_response.out_of_date}
   <div id="inject-code-button" transition:fade>
        <button onclick={callback}>Inject code</button>
        {#if !api_response.codemirror_code_updated}<p transition:fade>⚠️ Old code. Update</p>
        {:else if ((!config.show_wizard && !api_response.wasm_model))}
            <p transition:fade>🚫 Nothing injected </p>
        {:else if (config.show_wizard && !api_response.wizard_model)}
            <p transition:fade>🚫 Error on whamm side !!</p>
        {/if}
    </div>
{/if}

<style>
    div{
        width: 90%;
        margin: auto;
    }

    #inject-code-button{
        width: 50%;
        padding: 2%;
    }
    p {display: flex; justify-content: center;}
</style>