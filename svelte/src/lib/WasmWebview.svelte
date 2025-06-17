<script lang="ts">
    import wabt from 'wabt';

    // content here should be array of all the bytes for our wasm file
    let { contents } = $props();
    
    // Init WABT
    // @ts-ignore
    var WABT : WabtModule | undefined = undefined;
    wabt().then(wabt_=>{
        WABT = wabt_;});

    let loadContent = ()=>{
            if (contents && WABT){
                var myModule = WABT.readWasm(contents, {readDebugNames: true});
                myModule.applyNames();
                return myModule.toText({ foldExprs: false, inlineExport: false });
            }
            return "hiii";
        };
    // Function to load the content
    let html_content = $derived(contents ? loadContent() : "hi");

</script>
<p>{html_content}</p>
<style>
</style>
