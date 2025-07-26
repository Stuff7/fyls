import { saturateNum, withDelayedCleanup } from "./utils";

export const MAX_ZOOM = 5;

export function getControls() {
  const state = {
    translation: { x: 0, y: 0 },
    rotation: 0,
    zoom: 1,
    isFullscreen: false,
    isHidden: true,
    isDragging: false,
    showControls: () => {},
  };

  state.showControls = withDelayedCleanup(
    () => (state.isHidden = false),
    () => (state.isHidden = true),
  );

  return state;
}

type ControlsState = ReturnType<typeof getControls>;

export function resetAllControls(state: ControlsState) {
  state.rotation = 0;
  resetZoom(state);
}

export const isHorizontal = (state: ControlsState) =>
  state.rotation === 90 || state.rotation === 270;

export const rotationDeg = (state: ControlsState) => `${state.rotation}deg`;

export const translationPx = (state: ControlsState) =>
  state.zoom > 1 ? `${state.translation.x}px ${state.translation.y}px` : null;

export function doWheelZoom(state: ControlsState, e: WheelEvent) {
  if (e.deltaY < 0) state.zoom = Math.min(state.zoom + 0.1, MAX_ZOOM);
  else state.zoom = Math.max(state.zoom - 0.1, 0.1);
}

export function toggleFullscreen(elem?: Element) {
  if (!elem) return;
  if (document.fullscreenElement === elem) {
    document.exitFullscreen();
  } else {
    elem.requestFullscreen();
  }
}

export function startDrag(state: ControlsState, e: MouseEvent) {
  if (e.button === 1) state.isDragging = true;
}

export function doDrag(state: ControlsState, e: MouseEvent) {
  if (!state.isDragging) {
    return;
  }
  state.translation.x += e.movementX;
  state.translation.y += e.movementY;
}

export function endDrag(state: ControlsState) {
  state.isDragging = false;
}

export function isFullscreen(container?: HTMLElement) {
  return document.fullscreenElement === container;
}

export function resetZoom(state: ControlsState) {
  state.zoom = 1;
  state.translation.x = state.translation.y = 0;
}

export function controlsListener(
  state: ControlsState,
  e: KeyboardEvent,
  container?: HTMLElement,
) {
  if (!container) return;
  state.showControls();
  const k = e.key.toLowerCase();
  if (k === "f") {
    toggleFullscreen(container);
  } else if (k === "q") {
    state.rotation = saturateNum(state.rotation - 90, 0, 360);
  } else if (k === "e") {
    state.rotation = saturateNum(state.rotation + 90, 0, 360);
  } else if (k === "z") {
    resetZoom(state);
  } else if (k === "x") {
    state.zoom = Math.max(state.zoom - 0.1, 0.1);
  } else if (k === "c") {
    state.zoom = Math.min(state.zoom + 0.1, MAX_ZOOM);
  } else if (k === "w") {
    state.translation.y += state.zoom * 16;
  } else if (k === "a") {
    state.translation.x += state.zoom * 16;
  } else if (k === "s") {
    state.translation.y -= state.zoom * 16;
  } else if (k === "d") {
    state.translation.x -= state.zoom * 16;
  } else {
    return true;
  }
}
