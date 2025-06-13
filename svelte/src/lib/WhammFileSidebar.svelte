<script lang="ts">
    let whammFile = $state(null);
    const openWhammFile = (event: Event) =>{
        // @ts-ignore
        vscode.postMessage({
            command: "open-whamm-file"
        });
    }
</script>

<button type='button' onclick={openWhammFile}>Open Whamm file</button>