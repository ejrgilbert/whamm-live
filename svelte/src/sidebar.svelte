<script lang="ts">
  import Counter from './lib/Counter.svelte';
  // Ignore this because vscode is a constant defined for the window when the webview is rendered
  // @ts-ignore
  vscode.postMessage({
    command: 'svelte',
   });
</script>

<main>
  <h1>Live Whamm</h1>

  <div class="card">
    <Counter />
  </div>
</main>

<style>
</style>
