<script lang="ts">
  import WhammFileSidebar from './lib/WhammFileSidebar.svelte';
  // Ignore this because vscode is a constant defined for the window when the webview is rendered
</script>

<main>
  <h1>Live Whamm</h1>

  <div class="card">
    <WhammFileSidebar />
  </div>
</main>

<style>
  .card {
    padding: 5%;
  }
</style>
