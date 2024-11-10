import { ref, watchFn } from "jsx";
import RangeInput from "./RangeInput";
import { clamp, saturateNum, timestamp } from "~/utils";

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
  const [volume, setVolume] = ref(0);
  const [rotation, setRotation] = ref(0);
  const [speed, setSpeed] = ref(0);
  const [playing, setPlaying] = ref(false);
  const [clicked, setClicked] = ref(false);
  const [fullscreen, setFullscreen] = ref(false);
  const [hide, setHide] = ref(false);

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
    setPlaying(!this.muted);
    setSpeed(this.playbackRate);
    setVolume(this.volume);
    setDuration(this.duration);
    setProgress(this.currentTime);
  }

  function keyListener(e: KeyboardEvent) {
    showControls();
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
    else if (e.key.toLowerCase() === "m") {
      video.muted = !video.muted;
    }
    else if (e.key.toLowerCase() === "f") {
      toggleFullscreen();
    }
    else if (e.key.toLowerCase() === "q") {
      setRotation(saturateNum(rotation() - 90, 0, 360));
    }
    else if (e.key.toLowerCase() === "e") {
      setRotation(saturateNum(rotation() + 90, 0, 360));
    }
    else if (e.key === "ArrowLeft") {
      video.currentTime = Math.max(video.currentTime - seekOffset(), 0);
    }
    else if (e.key === "ArrowRight") {
      video.currentTime = Math.min(video.currentTime + seekOffset(), duration());
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
      on:mousemove={showControls}
      g:onkeydown={keyListener}
      g:onfullscreenchange={e => setFullscreen(e.currentTarget.fullscreenElement === container)}
    >
      <header>
        <strong class:title>{name()} | Q / E to rotate</strong>
        <button
          class:g-icon-btn
          class:g-transparent
          on:click={() => props["on:toggle"](!props.open)}
        >
          <i></i>
        </button>
      </header>
      <button
        class:play
        class:g-border
        on:click={() => video.paused ? video.play() : video.pause()}
        on:keydown={e => e.preventDefault()}
      >
        <i $transition:pop={clicked()}>{playing() ? "" : ""}</i>
      </button>
      <footer>
        <button
          class:control
          class:g-border
          on:click={() => video.paused ? video.play() : video.pause()}
          on:keydown={e => e.preventDefault()}
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
        />
        <strong>{timestamp(progress())}</strong>
        <button
          class:control
          class:g-border
          style:padding="0"
        >
          <i></i>
        </button>
        <RangeInput
          min={0}
          max={1}
          value={speed()}
          step={0.1}
          on:change={v => {
            setSpeed(v);
            video.playbackRate = v;
          }}
        />
        <strong>{speed().toFixed(1)}</strong>
        <button
          class:control
          class:g-border
          style:padding="0"
          on:click={() => video.muted = !video.muted}
        >
          <i>{volumeIcon()}</i>
        </button>
        <RangeInput
          min={0}
          max={1}
          value={volume()}
          step={0.01}
          on:change={v => video.volume = v}
        />
        <strong>{Math.round(volume() * 100)}%</strong>
        <button
          class:control
          class:g-border
          on:click={toggleFullscreen}
        >
          <i>{fullscreen() ? "" : ""}</i>
        </button>
      </footer>
      <video
        $ref={video}
        $src={props.src}
        class:horizontal={rotation() === 90 || rotation() === 270}
        style:rotate={`${rotation()}deg`}
        on:loadedmetadata={updateVideoStats}
        on:timeupdate={e => setProgress(e.currentTarget.currentTime)}
        on:play={e => setPlaying(!e.currentTarget.paused)}
        on:pause={e => setPlaying(!e.currentTarget.paused)}
        on:volumechange={e => setVolume(e.currentTarget.volume)}
      />
    </article>
  );
}
