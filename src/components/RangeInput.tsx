import { ref, watch } from "jsx";

type VideoProps = {
  value: number,
  min: number,
  max: number,
  step?: number,
  formatter?: (value: number) => unknown,
  "on:keydown"?: (e: KeyboardEvent) => void,
  "on:change": (value: number) => void,
};

export default function RangeInput(props: VideoProps) {
  const [percent, setPercent] = ref(0);
  const [hoverValue, setHoverValue] = ref(0);
  const [labelX, setLabelX] = ref(0);
  const [hoverPercent, setHoverPercent] = ref(0);

  watch(() => setPercent((props.value - props.min) * 100 / (props.max - props.min)));

  function updateHoverValue(this: HTMLDivElement, e: MouseEvent) {
    setLabelX(e.offsetX);
    setHoverValue(e.offsetX / this.clientWidth * (props.max - props.min));
    setHoverPercent(e.offsetX / this.clientWidth * 100);
  }

  return (
    <label class:RangeInput>
      <input
        type="range"
        $min={props.min}
        $max={props.max}
        $step={props.step}
        value={props.value}
        on:input={e => props["on:change"](+e.currentTarget.value)}
        on:mousemove={updateHoverValue}
        on:keydown={props["on:keydown"]}
      />
      <div
        class:progress
        var:progress={`${percent()}%`}
      />
      <label
        $if={!!props.formatter}
        var:x={`${labelX()}px`}
        class:left={hoverPercent() < 8}
        class:right={hoverPercent() > 92}
      >
        <strong>
          {props.formatter!(hoverValue())}
        </strong>
      </label>
    </label>
  );
}
