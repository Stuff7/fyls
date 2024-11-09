import { ref, watch } from "jsx";

const createLocalKey = (name: string) => `loclplyr__${name}`;
export const FILES_KEY = createLocalKey("files");

export function storedRef<T>(key: string, deserialize: (v: string | null) => T, serialize: (v: T) => string) {
  const localKey = createLocalKey(key);
  const ret = ref(deserialize(localStorage.getItem(localKey)));
  watch(() => localStorage.setItem(localKey, serialize(ret[0]())));
  return ret;
}

export function getVideoThumbnail(path: string, seekTime = 1) {
  return new Promise<string>((res, rej) => {
    const video = document.createElement("video");
    video.src = path;
    video.muted = true;
    video.preload = "metadata";

    video.addEventListener("loadedmetadata", () => {
      video.currentTime = Math.min(seekTime, video.duration - 0.1);
    });

    video.addEventListener("seeked", () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth / 2;
      canvas.height = video.videoHeight / 2;
      const context = canvas.getContext("2d");

      if (!context) {
        rej("Could not get canvas context");
        return;
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      res(canvas.toDataURL("image/png"));
      URL.revokeObjectURL(video.src);
    });

    video.addEventListener("error", (e) => {
      rej(e);
    });
  });
}
