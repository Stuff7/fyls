import RangeInput from "./RangeInput";
import { basicControls, getNameFromPath, MAX_ZOOM, percent } from "~/utils";

type ImgProps = {
  src: string,
  open: boolean,
  "on:toggle": (open: boolean) => void,
};


export default function Img(props: ImgProps) {
  let container!: HTMLElement;

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
    resetAll,
  } = basicControls(() => container);

  return (
    <article
      $ref={container}
      $if={props.open}
      class:Media
      class:Img
      class:hidden={hidden()}
      on:wheel={wheelZoom}
      on:mousedown={startDrag}
      on:mousemove={e => {
        showControls();
        drag(e);
      }}
      on:mouseup={endDrag}
      on:dblclick={toggleFullscreen}
      g:onkeydown={controlsListener}
      g:onfullscreenchange={updateFullscreen}
    >
      <header>
        <strong class:title>{getNameFromPath(props.src)} | Q / E to rotate</strong>
        <button
          class:g-icon-btn
          class:g-transparent
          on:click={() => props["on:toggle"](!props.open)}
        >
          <i></i>
        </button>
      </header>
      <footer>
        <span class:control>
          <button
            class:g-border
            class:g-transparent
            on:click={resetZoom}
          >
            <i></i>
          </button>
          <RangeInput
            min={0.1}
            max={MAX_ZOOM}
            value={zoom()}
            step={0.1}
            on:change={setZoom}
            on:keydown={e => e.preventDefault()}
          />
          <strong>{percent(zoom())}</strong>
        </span>
        <button
          class:control
          class:g-border
          class:g-transparent
          on:click={toggleFullscreen}
        >
          <i>{fullscreen() ? "" : ""}</i>
        </button>
      </footer>
      <img
        class:src
        $src={props.src}
        class:horizontal={isHorizontal()}
        style:rotate={rotationDeg()}
        style:scale={zoom()}
        style:translate={translationPx()}
        style:object-fit="contain"
        on:loadedmetadata={resetAll}
      />
    </article>
  );
}
