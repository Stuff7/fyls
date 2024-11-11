import { watchFn } from "jsx";

// Reusing the same video element reduces RAM usage considerably.
const video = document.createElement("video");
video.muted = true;
video.preload = "metadata";
video.onloadedmetadata = () => {
  video.currentTime = Math.floor(video.duration / 2);
};
video.onerror = (e) => {
  console.warn(e);
  processing = false;
};

let processing = false;

export default function VideoThumbnail(props: { shown: boolean, path: string }) {
  let canvas!: HTMLCanvasElement;

  queueMicrotask(() => {
    watchFn(() => props.shown, async () => {
      if (!props.shown) { return }

      while (processing) {
        await new Promise(res => setTimeout(res, 8));
      }

      processing = true;

      video.src = props.path;
      video.onseeked = () => {
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          console.warn("Could not get canvas context");
          processing = false;
          return;
        }

        canvas.width = canvas.parentElement?.offsetWidth || 200;

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = canvas.width / canvas.height;

        let drawWidth: number, drawHeight: number;

        if (videoAspect > canvasAspect) {
          drawWidth = canvas.width;
          drawHeight = canvas.width / videoAspect;
        }
        else {
          drawHeight = canvas.height;
          drawWidth = canvas.height * videoAspect;
        }

        const offsetX = (canvas.width - drawWidth) / 2;
        const offsetY = (canvas.height - drawHeight) / 2;

        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);

        URL.revokeObjectURL(video.src);
        processing = false;
      };
    });
  });

  return (
    <canvas
      $if={props.shown}
      $ref={canvas}
      class:Thumbnail
      height="200px"
    />
  );
}
