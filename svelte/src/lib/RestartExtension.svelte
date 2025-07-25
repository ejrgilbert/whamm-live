<script lang="ts">

function restart_extension(){
    // @ts-ignore
    vscode.postMessage({
        command: "restart-live-whamm"
    });
}

</script>

<button onclick={restart_extension} id="restart-extension" title="Restart Live Whamm extension">🔄</button>

<style>
#restart-extension{
    position: absolute;
    top: 0;
    right: 0;
    width: fit-content;
    background-color: transparent;
    outline: none;
}

#restart-extension:hover{
    transform: scale(1.2);
}
</style>