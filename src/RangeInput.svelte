<script lang="ts">
  type Props = {
    value: number;
    min: number;
    max: number;
    step?: number;
    formatter?: (value: number) => unknown;
    onKeyDown?: (e: KeyboardEvent) => void;
  };

  let {
    value = $bindable(),
    min,
    max,
    step,
    formatter,
    onKeyDown,
  }: Props = $props();

  let percent = $derived(((value - min) * 100) / (max - min));
  let hoverValue = $state(0);
  let labelX = $state(0);
  let hoverPercent = $state(0);

  function setHoverState(this: HTMLDivElement, e: MouseEvent) {
    labelX = e.offsetX;
    hoverValue = (e.offsetX / this.clientWidth) * (max - min);
    hoverPercent = (e.offsetX / this.clientWidth) * 100;
  }
</script>

<label class="range-input">
  <input
    type="range"
    {min}
    {max}
    {step}
    bind:value
    onmousemove={setHoverState}
    onkeydown={onKeyDown}
  />
  <div class="progress" style:--progress={`${percent}%`}></div>
  {#if formatter}
    <output
      style:--x={`${labelX}px`}
      class:left={hoverPercent < 8}
      class:right={hoverPercent > 92}
    >
      <strong>
        {formatter(hoverValue)}
      </strong>
    </output>
  {/if}
</label>
