<script lang="ts">
  import { clamp } from "./utils";

  type Props = {
    value: number;
    min: number;
    max: number;
    class?: string;
    vertical?: boolean;
    step?: number;
    formatter?: (value: number) => unknown;
  };

  let {
    value = $bindable(),
    min,
    max,
    class: clazz,
    vertical = false,
    step,
    formatter,
  }: Props = $props();

  let percent = $derived(((value - min) * 100) / (max - min));
  let hoverValue = $state(0);
  let labelX = $state(0);
  let hoverPercent = $state(0);

  function setHoverState(this: HTMLInputElement, e: MouseEvent) {
    const offset = vertical ? e.offsetY : e.offsetX;
    const size = vertical ? this.clientHeight : this.clientWidth;
    labelX = offset;
    const p = offset / size;
    const v = clamp(p * (max - min) + (vertical ? min : min), min, max);
    hoverValue = vertical ? max + min - v : v;
    hoverPercent = vertical ? 100 - p * 100 : p * 100;
  }
</script>

<label class={`range-input ${clazz}`} class:vertical>
  <input
    type="range"
    {min}
    {max}
    {step}
    bind:value
    onpointermove={setHoverState}
  />
  <div class="progress" style:--progress={`${percent}%`}>
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
  </div>
</label>
