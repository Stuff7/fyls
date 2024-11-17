import { ref, watch } from "jsx";

const createLocalKey = (name: string) => `fyls__${name}`;
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

export function percent(n: number) {
  return `${Math.round(n * 100)}%`;
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

export function getNameFromPath(path: string) {
  const idx = path.lastIndexOf("/");
  if (idx === -1) {
    return path;
  }

  return path.slice(idx + 1);
}

export function toggleFullscreen(elem: Element) {
  if (document.fullscreenElement === elem) {
    document.exitFullscreen();
  }
  else {
    elem.requestFullscreen();
  }
}

export function withDelayedCleanup(action: () => void, cleanup: () => void, delay = 1e3) {
  let hideTimeout = 0;
  return function() {
    action();
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(cleanup, delay);
  };
}

export const MAX_ZOOM = 20;
export function basicControls(container: () => Element) {
  const [rotation, setRotation] = ref(0);
  const [zoom, setZoom] = ref(1);
  const [hidden, setHidden] = ref(false);
  const [translation, setTranslation] = ref({ x: 0, y: 0 });
  const [fullscreen, setFullscreen] = ref(false);

  const showControls = withDelayedCleanup(() => setHidden(false), () => setHidden(true));

  let dragging = false;
  function drag(e: MouseEvent) {
    if (!dragging) { return }
    setTranslation.byRef(t => {
      t.x += e.movementX;
      t.y += e.movementY;
    });
  }

  function wheelZoom(e: WheelEvent) {
    if (e.deltaY < 0) {
      setZoom(Math.min(zoom() + 0.1, MAX_ZOOM));
    }
    else {
      setZoom(Math.max(zoom() - 0.1, 0.1));
    }
  }

  function resetZoom() {
    setZoom(1);
    setTranslation.byRef(t => t.x = t.y = 0);
  }

  function controlsListener(e: KeyboardEvent) {
    showControls();
    const k = e.key.toLowerCase();
    if (k === "f") {
      toggleFullscreen(container());
    }
    else if (k === "q") {
      setRotation(saturateNum(rotation() - 90, 0, 360));
    }
    else if (k === "e") {
      setRotation(saturateNum(rotation() + 90, 0, 360));
    }
    else if (k === "z") {
      resetZoom();
    }
    else if (k === "x") {
      setZoom(Math.max(zoom() - 0.1, 0.1));
    }
    else if (k === "c") {
      setZoom(Math.min(zoom() + 0.1, MAX_ZOOM));
    }
    else if (k === "w") {
      setTranslation.byRef(t => t.y += zoom() * 16);
    }
    else if (k === "a") {
      setTranslation.byRef(t => t.x += zoom() * 16);
    }
    else if (k === "s") {
      setTranslation.byRef(t => t.y -= zoom() * 16);
    }
    else if (k === "d") {
      setTranslation.byRef(t => t.x -= zoom() * 16);
    }
    else {
      return true;
    }
  }

  return {
    hidden,
    wheelZoom,
    showControls,
    startDrag: (e: MouseEvent) => {
      if (e.button === 1) {
        dragging = true;
      }
    },
    drag,
    endDrag: () => dragging = false,
    controlsListener,
    toggleFullscreen: () => toggleFullscreen(container()),
    updateFullscreen: () => setFullscreen(document.fullscreenElement === container()),
    resetZoom,
    zoom,
    setZoom,
    fullscreen,
    isHorizontal: () => rotation() === 90 || rotation() === 270,
    rotationDeg: () => `${rotation()}deg`,
    translationPx: () => zoom() > 1 ? `${translation().x}px ${translation().y}px` : null,
    setRotation,
    resetAll: () => {
      setRotation(0);
      resetZoom();
    },
  };
}
