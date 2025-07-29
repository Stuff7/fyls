<script lang="ts">
  import type { Snippet } from "svelte";
  import RangeInput from "./RangeInput.svelte";
  import {
    clamp,
    disableSpace,
    localStorageSet,
    timestamp,
    withDelayedCleanup,
  } from "./utils";
  import { scale } from "svelte/transition";

  const MAX_SPEED = 5;

  type Props = {
    src: string;
    rotation: number;
    zoomFactor: number;
    translation: { x: number; y: number };
    video?: HTMLVideoElement;
    controls: Snippet;
  };

  let {
    src,
    rotation,
    zoomFactor,
    translation,
    controls,
    video = $bindable(),
  }: Props = $props();

  let paused = $state(true);
  let duration = $state(0);
  let progress = $state(0);
  let volumeFactor = $state(1);
  let muted = $state(false);
  let speedFactor = $state(1);
  let loop = $state(true);
  let slice = $state({ step: -1, start: 0, end: 0 });
  let playVisible = $state(false);

  const seekOffset = $derived(Math.min(duration / 33, 5));
  const volume = $derived(volumeFactor * 100);
  const speed = $derived(speedFactor * 100);
  $effect(() => localStorageSet("volume", volumeFactor, JSON.stringify));
  $effect(() => localStorageSet("loop", loop, JSON.stringify));

  const showPlay = withDelayedCleanup(
    () => (playVisible = true),
    () => (playVisible = false),
    350,
  );

  $effect(() => {
    paused;
    showPlay();
  });

  const volumeIcon = $derived.by(() => {
    if (muted) return "";
    if (volume > 50) return "";
    if (volume > 15) return "";
    return "";
  });

  function setupSlice() {
    if (slice.step === -1) {
      slice.step = 0;
      slice.start = progress;
      return;
    } else if (slice.step === 1) {
      slice.step = -1;
    } else {
      slice.end = progress;
      slice.step = 1;
    }
  }

  function reproduceVideo() {
    if (slice.step === 1 && (progress > slice.end || progress < slice.start)) {
      progress = slice.start;
    }
    // Workaround for native video loop not working sometimes
    if (loop && progress >= duration - 0.8) progress = 0;
  }

  function keyListener(e: KeyboardEvent) {
    const k = e.key.toLowerCase();
    if (e.key === "," || e.key === ".") {
      // Next/Prev frame
      if (!paused) paused = true;
      progress = clamp(progress + (e.key === "," ? -1 : 1) / 30, 0, duration);
    } else if (e.key === "<") {
      speedFactor = Math.max(speedFactor - 0.1, 0.01);
    } else if (e.key === ">") {
      speedFactor = Math.min(speedFactor + 0.1, MAX_SPEED);
    } else if (e.key === "?") {
      speedFactor = 1;
    } else if (e.key === " ") {
      paused = !paused;
    } else if (k === "m") {
      muted = !muted;
    }

    if (!e.shiftKey) return;
    if (e.key === "ArrowLeft") {
      progress = Math.max(progress - seekOffset, 0);
    } else if (e.key === "ArrowRight") {
      progress = Math.min(progress + seekOffset, duration);
    } else if (e.key === "ArrowDown") {
      volumeFactor = Math.max(volumeFactor - 0.05, 0);
    } else if (e.key === "ArrowUp") {
      volumeFactor = Math.min(volumeFactor + 0.05, 1);
    }
  }
</script>

<svelte:window onkeydown={keyListener} />

<video
  class="src"
  bind:this={video}
  {src}
  {loop}
  class:horizontal={rotation === 90 || rotation === 270}
  style:rotate={`${rotation}deg`}
  style:scale={zoomFactor}
  style:translate={`${translation.x}px ${translation.y}px`}
  onloadedmetadata={() => (slice.step = -1)}
  ontimeupdate={reproduceVideo}
  bind:duration
  bind:currentTime={progress}
  bind:playbackRate={speedFactor}
  bind:paused
  bind:volume={volumeFactor}
  bind:muted
>
  <track kind="captions" />
</video>
<button
  class="play icon"
  onclick={() => (paused = !paused)}
  onkeydown={disableSpace}
>
  {#if playVisible}
    <span transition:scale={{ duration: 150 }}>
      {paused ? "" : ""}
    </span>
  {/if}
</button>
<footer>
  <button
    class="icon"
    onclick={() => (paused = !paused)}
    onkeydown={disableSpace}
  >
    {paused ? "" : ""}
  </button>
  <RangeInput
    class="progress-bar"
    min={0}
    max={duration}
    bind:value={progress}
    step={0.1}
    formatter={timestamp}
  />
  <span>{timestamp(progress)}/<strong>{timestamp(duration)}</strong></span>
  <button
    class="control"
    class:bg-green-500!={slice.step === 1}
    onclick={setupSlice}
    onkeydown={disableSpace}
  >
    <strong>{slice.step === -1 ? "A" : timestamp(slice.start)}</strong>
    /
    <strong>{slice.step !== 1 ? "B" : timestamp(slice.end)}</strong>
  </button>
  <button class="icon" onclick={() => (loop = !loop)} onkeydown={disableSpace}>
    {loop ? "" : ""}
  </button>
  <span class="control">
    <button
      class="icon"
      onclick={() => (speedFactor = 1)}
      onkeydown={disableSpace}
    >
      
    </button>
    <RangeInput
      min={0}
      max={MAX_SPEED}
      bind:value={speedFactor}
      step={0.01}
      vertical
      formatter={(v) => `${Math.round(v * 100)}%`}
    />
    <strong>{Math.round(speed)}%</strong>
  </span>
  <span class="control">
    <button
      class="icon"
      onclick={() => (muted = !muted)}
      onkeydown={disableSpace}>{volumeIcon}</button
    >
    <RangeInput
      min={0}
      max={1}
      bind:value={volumeFactor}
      step={0.01}
      vertical
      formatter={(v) => `${Math.round(v * 100)}%`}
    />
    <strong>{Math.round(volume)}%</strong>
  </span>
  {@render controls()}
</footer>
