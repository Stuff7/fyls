<script lang="ts" module>
  // Reusing the same video element reduces RAM usage considerably.
  const video = document.createElement("video");

  video.muted = true;
  video.preload = "metadata";

  video.onloadedmetadata = () => {
    video.currentTime = 0;
  };

  video.addEventListener("error", () => {
    processing = false;
  });

  let processing = false;

  export function getVideoErrorMessage(video: HTMLVideoElement): string {
    const err = video.error;
    if (!err) return "💥 Unknown video error";

    const codeMap: Record<number, string> = {
      [MediaError.MEDIA_ERR_ABORTED]:
        "MEDIA_ERR_ABORTED: fetching process aborted by user",
      [MediaError.MEDIA_ERR_NETWORK]:
        "MEDIA_ERR_NETWORK: error occurred when downloading",
      [MediaError.MEDIA_ERR_DECODE]:
        "MEDIA_ERR_DECODE: error occurred when decoding",
      [MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED]:
        "MEDIA_ERR_SRC_NOT_SUPPORTED: audio/video not supported",
    };

    return codeMap[err.code] || `Unknown error code: ${err.code}`;
  }
</script>

<script lang="ts">
  import { onDestroy, onMount } from "svelte";

  import type { FileType } from "./types";
  import { timestamp } from "./utils";

  const { shown = false, path = "", ftype = "other" as FileType } = $props();
  let canvas = $state<HTMLCanvasElement>();
  let error = $state("");
  let duration = $state(-1);

  const getMeta = () => {
    if (video.src !== path) return;
    duration = video.duration || -2;
  };

  onMount(() => video.addEventListener("loadedmetadata", getMeta));
  onDestroy(() => video.removeEventListener("loadedmetadata", getMeta));

  $effect(() => {
    if (!shown) return;

    (async () => {
      while (processing) {
        await new Promise((res) => setTimeout(res, 8));
      }

      processing = true;
      video.src = path;

      video.onseeked = () => {
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          processing = false;
          error = "Could not get canvas context";
          return;
        }

        canvas.width = canvas.parentElement?.offsetWidth || 200;

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = canvas.width / canvas.height;

        let drawWidth: number;
        let drawHeight: number;

        if (videoAspect > canvasAspect) {
          drawWidth = canvas.width;
          drawHeight = canvas.width / videoAspect;
        } else {
          drawHeight = canvas.height;
          drawWidth = canvas.height * videoAspect;
        }

        const offsetX = (canvas.width - drawWidth) / 2;
        const offsetY = (canvas.height - drawHeight) / 2;

        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);

        URL.revokeObjectURL(video.src);
        processing = false;
        error = "";
      };

      video.onerror = () => (error = getVideoErrorMessage(video));
    })();
  });
</script>

{#if shown}
  <div
    class="
      relative
      w-[200px] h-[200px] mx-auto
      rounded-xl
      bg-white dark:bg-zinc-800/50
      border border-zinc-300/50 dark:border-zinc-700/50
      shadow-lg dark:shadow-black/50
      overflow-hidden
      flex items-center justify-center
      transition
      duration-50
      hover:scale-[1.05]
      hover:shadow-2xl dark:hover:shadow-black/70
      cursor-pointer
      select-none
    "
    aria-label="Thumbnail container"
  >
    {#if ftype === "image"}
      <img
        src={path}
        alt="Thumbnail preview"
        class="max-w-full max-h-full object-contain"
        draggable="false"
        loading="lazy"
      />
    {:else if !error}
      <canvas
        bind:this={canvas}
        class="max-w-full max-h-full"
        class:invisible={error}
        height="200"
        width="200"
      ></canvas>
      <strong
        class="absolute z-1 bottom-2 right-2 bg-zinc-950/55 rounded-sm px-2 py-1"
        >{timestamp(duration)}</strong
      >
    {:else}
      <i
        title={error}
        class="absolute text-red-600 dark:text-red-400 text-4xl top-1/2 left-1/2 -translate-1/2"
      >
        
      </i>
    {/if}
  </div>
{/if}
