<script lang="ts">
    // Current value
    let wizard_tab = $state(false);

    const changeTabSelected = () => {
        wizard_tab = !wizard_tab;
    }
</script>

<main>
    <div class="tab">
        <button onclick={changeTabSelected} class="tab-option">Switch to {wizard_tab? "static bytecode": "Wizard"}</button>
    </div>
    {#if wizard_tab}
       <h3> Wizard tab selected</h3> 
    {:else}
       <h3> Static tab selected</h3> 
    {/if}

</main>

<style>
.tab{
    text-align: right;
}

.tab button{
    padding: 2%;
    font-size: large;
}
</style>
