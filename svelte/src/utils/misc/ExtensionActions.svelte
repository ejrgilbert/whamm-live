<script lang="ts">

function restart_extension(){
    // @ts-ignore
    vscode.postMessage({
        command: "restart-live-whamm"
    });
}

</script>

<div id="top-right-buttons">
  <a href="https://github.com/ejrgilbert/whamm-live/blob/main/GUIDE.md" target="_blank" title="Help">
    <button>❓</button>
  </a>
  <a href="https://github.com/ejrgilbert/whamm-live/issues" target="_blank" title="Report an Issue">
    <button>🐞</button>
  </a>
  <button onclick={restart_extension} title="Restart Live Whamm extension">🔄</button>
</div>

<style>
#top-right-buttons {
  position: absolute;
  top: 0px;
  right: 5px;
  display: flex;
  gap: 5px;
  z-index: 1000;
}

#top-right-buttons button {
  background-color: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.2em;
  transition: transform 0.2s ease;
  outline: none;
}

#top-right-buttons button:hover {
  transform: scale(1.2);
}

#top-right-buttons a {
  text-decoration: none;
}
</style>
