<script lang="ts">
  let {legend_config} = $props();
  let highlightColorToMessage: Record<string, string> = legend_config[0];
  let circleColorToMessage: Record<string, string> = legend_config[1];


</script>

<div class='my-legend'>
  {#if highlightColorToMessage && Object.keys(highlightColorToMessage).length > 0}
    <div class='legend-title'>Highlight legend</div>
    <div class='legend-scale'>
      <ul class='legend-labels'>
            {#each Object.entries(highlightColorToMessage) as [color, message]}
                <li><span style='background:{color};'></span>{message}</li>
            {/each}
      </ul>
    </div>
  {/if}

  {#if circleColorToMessage && Object.keys(circleColorToMessage).length > 0}
  <div class='legend-title'>Visual markers <span style="font-style: italic; font-size: 0.8em">(no code injected)</span></div>
  <div class='legend-scale'>
    <ul class='legend-labels'>
          {#each Object.entries(circleColorToMessage) as [color, message]}
              <li><span style='background:{color}; border-radius: 50%'></span>{message}</li>
          {/each}
      </ul>
  </div>
  {/if}
</div>

<style>
.my-legend {
    font-size: 0.8em;
    font-weight: bold;
    padding: 1%;
    margin: auto;
    width: 90%;
}

.legend-title{
  margin-top: 1%;
  margin-bottom: 1%;
}

.legend-scale li {
  display: flex;
  margin: 2px 0;
}
.legend-scale li span {
  width: 14px;
  height: 14px;
  margin-right: 6px;
  border: 1px solid #ccc;
}
</style>