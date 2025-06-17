<script lang="ts">
    // content here should be array of all the bytes for our wasm file
    let { view } = $props();
    const load_html = function(node: HTMLElement){
        // Remove focus highlight
        if (view) document.getElementById("wasm-webview-code-editor")?.appendChild(view.dom);
    }
</script>
<div use:load_html id="wasm-webview-code-editor"></div>
<style>
    div{
        width: 90%;
        margin: auto;
    }
</style>
