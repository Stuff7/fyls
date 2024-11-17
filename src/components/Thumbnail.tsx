import { ref, watchFn } from "jsx";
import { FileType } from "./Directory";

// Reusing the same video element reduces RAM usage considerably.
const video = document.createElement("video");
video.muted = true;
video.preload = "metadata";
video.onloadedmetadata = () => {
  video.currentTime = Math.floor(video.duration / 2);
};
video.addEventListener("error", () => processing = false);

let processing = false;

type ThumbnailProps = {
  shown: boolean,
  path: string,
  type: FileType,
};

export default function VideoThumbnail(props: ThumbnailProps) {
  let canvas!: HTMLCanvasElement;
  const [error, setError] = ref("");

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
          processing = false;
          setError("Could not get canvas context");
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
        setError("");
      };

      video.onerror = () => setError("Unsupported format");
    });
  });

  return (
    <>
      <img
        $if={props.shown && props.type === "image"}
        $src={props.path}
        style:height="200px"
        style:object-fit="contain"
      />
      <canvas
        $if={props.shown && !error()}
        $ref={canvas}
        class:Thumbnail
        height="200px"
      />
      <i $if={props.shown && props.type !== "image" && !!error()} $title={error()}></i>
    </>
  );
}
