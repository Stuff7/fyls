import { ref, watchFn } from "jsx";
import RangeInput from "./RangeInput";
import { clamp, percent, basicControls, storedRef, timestamp, getNameFromPath, MAX_ZOOM } from "~/utils";

type VideoProps = {
  src: string,
  open: boolean,
  "on:toggle": (open: boolean) => void,
};

export default function Video(props: VideoProps) {
  let container!: HTMLElement;
  let video!: HTMLVideoElement;

  const {
    hidden,
    wheelZoom,
    showControls,
    startDrag,
    drag,
    endDrag,
    controlsListener,
    toggleFullscreen,
    updateFullscreen,
    resetZoom,
    zoom,
    setZoom,
    fullscreen,
    isHorizontal,
    rotationDeg,
    translationPx,
    setRotation,
  } = basicControls(() => container);

  const [duration, setDuration] = ref(0);
  const [progress, setProgress] = ref(0);
  const [volume, setVolume] = storedRef<number>("volume", v => v != null ? JSON.parse(v) : 1, JSON.stringify);
  const [speed, setSpeed] = ref(0);
  const [playing, setPlaying] = ref(false);
  const [loop, setLoop] = storedRef<boolean>("loop", v => v ? JSON.parse(v) : false, JSON.stringify);
  const [clicked, setClicked] = ref(false);
  const [slice, setSlice] = ref({ step: -1, start: 0, end: 0 });

  const seekOffset = () => Math.min(duration() / 10, 5);

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

  function keyListener(e: KeyboardEvent) {
    if (!controlsListener(e)) { return }

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
      video.playbackRate = Math.min(video.playbackRate + 0.1, MAX_SPEED);
      setSpeed(video.playbackRate);
    }
    else if (e.key === "?") {
      video.playbackRate = 1;
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
      class:Media
      class:Video
      class:playing={playing()}
      class:hidden={hidden()}
      on:wheel={wheelZoom}
      on:mousedown={startDrag}
      on:mousemove={e => {
        showControls();
        drag(e);
      }}
      on:mouseup={endDrag}
      g:onkeydown={keyListener}
      g:onfullscreenchange={updateFullscreen}
    >
      <header>
        <strong class:title>{getNameFromPath(props.src)} | Q / E to rotate</strong>
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
            max={MAX_ZOOM}
            value={zoom()}
            step={0.1}
            on:change={v => setZoom(v)}
            on:keydown={e => e.preventDefault()}
          />
          <strong>{percent(zoom())}</strong>
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
            max={MAX_SPEED}
            value={speed()}
            step={0.1}
            on:change={updateSpeed}
            on:keydown={e => e.preventDefault()}
          />
          <strong>{percent(speed())}</strong>
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
          <strong>{percent(volume())}</strong>
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
        class:src
        $ref={video}
        $src={props.src}
        $loop={loop()}
        class:horizontal={isHorizontal()}
        style:rotate={rotationDeg()}
        style:scale={zoom()}
        style:translate={translationPx()}
        on:loadedmetadata={updateVideoStats}
        on:timeupdate={reproduceVideo}
        on:play={e => setPlaying(!e.currentTarget.paused)}
        on:pause={e => setPlaying(!e.currentTarget.paused)}
        on:volumechange={e => setVolume(e.currentTarget.volume)}
      />
    </article>
  );
}

const MAX_SPEED = 5;
