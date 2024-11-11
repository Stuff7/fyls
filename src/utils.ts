import { ref, watch } from "jsx";

const createLocalKey = (name: string) => `loclplyr__${name}`;
export const FILES_KEY = createLocalKey("files");

export function storedRef<T>(key: string, deserialize: (v: string | null) => T, serialize: (v: T) => string) {
  const localKey = createLocalKey(key);
  const ret = ref(deserialize(localStorage.getItem(localKey)));
  watch(() => localStorage.setItem(localKey, serialize(ret[0]())));
  return ret;
}

export function padNum(n: number, len = 2) {
  return n.toString().padStart(len, "0");
}

export function timestamp(seconds: number) {
  let s = seconds / 60;
  let m = Math.floor(s);
  s = Math.round((s - m) * 60);
  const h = Math.floor(m / 60);
  m -= h * 60;

  return (h ? [h, m, s] : [m, s]).map(n => padNum(n, 2)).join(":");
}

export function advanceOneFrame(video: HTMLVideoElement, frameRate = 30) {
  if (!video.paused) {
    video.pause();
  }
  video.currentTime += 1 / frameRate;
}

export function clamp(n: number, min: number, max: number) {
  if (n < min) {
    return min;
  }
  if (n > max) {
    return max;
  }
  return n;
}

export function saturateNum(n: number, min: number, max: number) {
  if (n < min) {
    return saturateNum(max - (min - n), min, max);
  }
  if (n > max) {
    return saturateNum(min + (n - max), min, max);
  }
  return n;
}

export function navigate(path: string) {
  location.hash = path ? `#${path}` : "";
}
