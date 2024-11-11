import { ref, watchFn } from "jsx";
import RangeInput from "./RangeInput";
import { clamp, saturateNum, storedRef, timestamp } from "~/utils";

type VideoProps = {
  src: string,
  open: boolean,
  "on:toggle": (open: boolean) => void,
};

export default function Video(props: VideoProps) {
  let container!: HTMLElement;
  let video!: HTMLVideoElement;

  const [duration, setDuration] = ref(0);
  const [progress, setProgress] = ref(0);
  const [volume, setVolume] = storedRef<number>("volume", v => v != null ? JSON.parse(v) : 1, JSON.stringify);
  const [rotation, setRotation] = ref(0);
  const [speed, setSpeed] = ref(0);
  const [zoom, setZoom] = ref(1);
  const [playing, setPlaying] = ref(false);
  const [loop, setLoop] = storedRef<boolean>("loop", v => v ? JSON.parse(v) : false, JSON.stringify);
  const [clicked, setClicked] = ref(false);
  const [fullscreen, setFullscreen] = ref(false);
  const [hide, setHide] = ref(false);
  const [translation, setTranslation] = ref({ x: 0, y: 0 });
  const [slice, setSlice] = ref({ step: -1, start: 0, end: 0 });

  const seekOffset = () => Math.min(duration() / 10, 5);
  const name = () => {
    const idx = props.src.lastIndexOf("/");
    if (idx === -1) {
      return props.src;
    }

    return props.src.slice(idx + 1);
  };

  function volumeIcon() {
    volume();
    if (video?.muted) {
      return "";
    }
    if (volume() > 0.5) {
      return "";
    }
    if (volume() > 0.15) {
      return "";
    }
    return "";
  }

  let hideTimeout = 0;
  function showControls() {
    setHide(false);
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => setHide(true), 1e3);
  }

  function toggleFullscreen() {
    if (document.fullscreenElement === container) {
      document.exitFullscreen();
    }
    else {
      container.requestFullscreen();
    }
  }

  function updateVideoStats(this: HTMLVideoElement) {
    setPlaying(!this.paused);
    setSpeed(this.playbackRate);
    setRotation(0);
    resetZoom();
    setDuration(this.duration);
    setProgress(this.currentTime);
    setSlice.byRef(s => s.step = -1);
    this.volume = volume();
  }

  function updateSpeed(v: number) {
    setSpeed(v);
    video.playbackRate = v;
  }

  function reproduceVideo() {
    const s = slice();
    if (s.step === 1 && video.currentTime > s.end) {
      video.currentTime = s.start;
    }
    setProgress(video.currentTime);
  }

  function setupSlice() {
    setSlice.byRef(slice => {
      if (slice.step === -1) {
        slice.step = 0;
        slice.start = video.currentTime;
        return;
      }
      else if (slice.step === 1) {
        slice.step = -1;
      }
      else {
        slice.end = video.currentTime;
        slice.step = 1;
      }
    });
  }

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
      setZoom(Math.min(zoom() + 0.1, 20));
    }
    else {
      setZoom(Math.max(zoom() - 0.1, 0.1));
    }
  }

  function resetZoom() {
    setZoom(1);
    setTranslation.byRef(t => t.x = t.y = 0);
  }

  function keyListener(e: KeyboardEvent) {
    showControls();
    const k = e.key.toLowerCase();
    if (e.key === "," || e.key === ".") { // Next/Prev frame
      if (!video.paused) {
        video.pause();
      }
      video.currentTime = clamp(video.currentTime + (e.key === "," ? -1 : 1) / 30, 0, duration());
    }
    else if (e.key === "<") {
      video.playbackRate = Math.max(video.playbackRate - 0.1, 0.01);
      setSpeed(video.playbackRate);
    }
    else if (e.key === ">") {
      video.playbackRate = Math.min(video.playbackRate + 0.1, 1);
      setSpeed(video.playbackRate);
    }
    else if (e.key === " ") {
      if (video.paused) {
        video.play();
      }
      else {
        video.pause();
      }
    }
    else if (k === "m") {
      video.muted = !video.muted;
    }
    else if (k === "f") {
      toggleFullscreen();
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
      setZoom(Math.min(zoom() + 0.1, 20));
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
    else if (e.key === "ArrowLeft") {
      video.currentTime = Math.max(video.currentTime - seekOffset(), 0);
    }
    else if (e.key === "ArrowRight") {
      video.currentTime = Math.min(video.currentTime + seekOffset(), duration());
    }
    else if (e.key === "ArrowDown") {
      video.volume = Math.max(video.volume - 0.05, 0);
    }
    else if (e.key === "ArrowUp") {
      video.volume = Math.min(video.volume + 0.05, 1);
    }
  }

  function disableSpace(e: KeyboardEvent) {
    if (e.key === " ") {
      e.preventDefault();
    }
  }

  let clickedTimeout = 0;
  watchFn(playing, () => {
    setClicked(true);
    clearTimeout(clickedTimeout);
    clickedTimeout = setTimeout(() => setClicked(false), 400);
  });

  return (
    <article
      $ref={container}
      $if={props.open}
      class:Video
      class:playing={playing()}
      class:hidden={hide()}
      on:wheel={wheelZoom}
      on:mousedown={e => e.button === 1 && (dragging = true)}
      on:mousemove={e => {
        showControls();
        drag(e);
      }}
      on:mouseup={() => dragging = false}
      g:onkeydown={keyListener}
      g:onfullscreenchange={() => setFullscreen(document.fullscreenElement === container)}
    >
      <header>
        <strong class:title>{name()} | Q / E to rotate</strong>
        <button
          class:g-icon-btn
          class:g-transparent
          on:click={() => props["on:toggle"](!props.open)}
          on:keydown={disableSpace}
        >
          <i></i>
        </button>
      </header>
      <button
        class:play
        class:g-border
        class:g-transparent
        on:click={() => video.paused ? video.play() : video.pause()}
        on:dblclick={toggleFullscreen}
        on:keydown={disableSpace}
      >
        <i $transition:pop={clicked()}>{playing() ? "" : ""}</i>
      </button>
      <footer>
        <button
          class:control
          class:g-border
          class:g-transparent
          on:click={() => video.paused ? video.play() : video.pause()}
          on:keydown={disableSpace}
        >
          <i>{playing() ? "" : ""}</i>
        </button>
        <RangeInput
          min={0}
          max={duration()}
          value={progress()}
          step={0.1}
          formatter={timestamp}
          on:change={v => video.currentTime = v}
          on:keydown={e => e.preventDefault()}
        />
        <strong><em>{timestamp(progress())}</em>/{timestamp(duration())}</strong>
        <button
          class:control
          class:g-border={slice().step !== 1}
          on:click={setupSlice}
          on:keydown={disableSpace}
          style:padding-inline="var(--spacing-nm)"
        >
          <strong>{slice().step === -1 ? "A" : timestamp(slice().start)}</strong>
          /
          <strong>{slice().step !== 1 ? "B" : timestamp(slice().end)}</strong>
        </button>
        <button
          class:control
          class:g-border
          class:g-transparent
          on:click={() => setLoop(!loop())}
          on:keydown={disableSpace}
        >
          <i>{loop() ? "" : ""}</i>
        </button>
        <span class:control>
          <button
            class:g-border
            class:g-transparent
            on:click={resetZoom}
            on:keydown={disableSpace}
          >
            <i></i>
          </button>
          <RangeInput
            min={0.1}
            max={20}
            value={zoom()}
            step={0.1}
            on:change={v => setZoom(v)}
            on:keydown={e => e.preventDefault()}
          />
          <strong>{zoom().toFixed(1)}</strong>
        </span>
        <span class:control>
          <button
            class:g-border
            class:g-transparent
            on:click={() => updateSpeed(1)}
            on:keydown={disableSpace}
          >
            <i></i>
          </button>
          <RangeInput
            min={0}
            max={1}
            value={speed()}
            step={0.1}
            on:change={updateSpeed}
            on:keydown={e => e.preventDefault()}
          />
          <strong>{speed().toFixed(1)}</strong>
        </span>
        <span class:control>
          <button
            class:g-border
            class:g-transparent
            on:click={() => video.muted = !video.muted}
            on:keydown={disableSpace}
          ><i>{volumeIcon()}</i></button>
          <RangeInput
            min={0}
            max={1}
            value={volume()}
            step={0.01}
            on:change={v => video.volume = v}
            on:keydown={e => e.preventDefault()}
          />
          <strong>{Math.round(volume() * 100)}%</strong>
        </span>
        <button
          class:control
          class:g-border
          class:g-transparent
          on:click={toggleFullscreen}
          on:keydown={disableSpace}
        >
          <i>{fullscreen() ? "" : ""}</i>
        </button>
      </footer>
      <video
        $ref={video}
        $src={props.src}
        $loop={loop()}
        class:horizontal={rotation() === 90 || rotation() === 270}
        style:rotate={`${rotation()}deg`}
        style:scale={zoom()}
        style:translate={zoom() > 1 ? `${translation().x}px ${translation().y}px` : null}
        on:loadedmetadata={updateVideoStats}
        on:timeupdate={reproduceVideo}
        on:play={e => setPlaying(!e.currentTarget.paused)}
        on:pause={e => setPlaying(!e.currentTarget.paused)}
        on:volumechange={e => setVolume(e.currentTarget.volume)}
      />
    </article>
  );
}
