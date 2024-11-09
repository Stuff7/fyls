import { watchFn } from "jsx";

export default function VideoThumbnail(props: { shown: boolean, path: string }) {
  let wrapper!: HTMLDivElement;
  let canvas!: HTMLCanvasElement;

  queueMicrotask(() => {
    watchFn(() => props.shown, () => {
      if (!props.shown) { return }

      (new Promise<string>((res, rej) => {
        const video = document.createElement("video");
        video.src = props.path;
        video.muted = true;
        video.preload = "metadata";

        video.addEventListener("loadedmetadata", () => {
          video.currentTime = Math.min(Math.floor(video.duration / 2), video.duration - 0.1);
        });

        video.addEventListener("seeked", () => {
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            rej("Could not get canvas context");
            return;
          }
          canvas.width = wrapper.offsetWidth;

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
          res("All good");
        });

        video.addEventListener("error", (e) => {
          rej(e);
        });
      }));
    });
  });

  return (
    <div $if={props.shown} $ref={wrapper}>
      <canvas $ref={canvas} height="200px" />
    </div>
  );
}
