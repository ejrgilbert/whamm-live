<script>
  import { highlight_data } from "../data/highlight_data.svelte";
  import { highlight_navigation_data, reset_highlight_navigation_data, scrollToAnotherHighlight } from "../data/highlight_navigation_data.svelte";
  const {view} = $props();

</script>
{#if highlight_data.all_wat_lines.length > 0}
    <div use:reset_highlight_navigation_data id="footer">
    <div class="button-container">
        <button onclick={() => {scrollToAnotherHighlight(false, view)}}>⬅️</button>
        <button onclick={() => {scrollToAnotherHighlight(true, view)}}>➡️</button>
    </div>
    <div id="cursorHighlightInfo">{highlight_navigation_data.cursor_highlight_button_clicked ? "Current" : "Next"} cursor highlight at: <span style="color:midnightblue;">Line {highlight_data.all_wat_lines[highlight_navigation_data.current_index]} <span style="font-size: xx-small;">({highlight_navigation_data.current_index+1}/{highlight_data.all_wat_lines.length})</span></span></div>
    </div>
{/if}
<style>
    #footer{
        position: fixed;
        text-align: center;
        /* Make sure it stays on top */
        z-index: 1000;
        background: rgba(128, 128, 128, 0.7);
        backdrop-filter: blur(10px);
        bottom: 0;
        left: 0;
        right: 0;
    }
    .button-container {
        display: flex;
        justify-content: center;
        gap: 5%;
    }
    .button-container button{
        background: transparent;
        width: 1em;
        font-size: x-large;
        outline: none;
    }
    .button-container button:hover{
        transform: scale(1.2);
    }

    #cursorHighlightInfo{
        font-family: var(--cm-editor-font-family, monospace);
        color: black;
        font-size: smaller;
    }
</style>