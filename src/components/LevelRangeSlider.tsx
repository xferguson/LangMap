import { cloneElement } from "react";
import type { KeyboardEvent } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import type { Level } from "../types";
import { LEVEL_ORDER } from "../lib/levels";

interface Props {
  value: { min: Level; max: Level };
  onChange: (next: { min: Level; max: Level }) => void;
}

export function LevelRangeSlider({ value, onChange }: Props) {
  const minIdx = LEVEL_ORDER.indexOf(value.min);
  const maxIdx = LEVEL_ORDER.indexOf(value.max);

  const handleSlider = (next: number | number[]) => {
    if (!Array.isArray(next) || next.length < 2) return;
    const [a, b] = next;
    onChange({ min: LEVEL_ORDER[a], max: LEVEL_ORDER[b] });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.defaultPrevented) return;
    const target = e.target as HTMLElement | null;
    const tid = target?.getAttribute("data-testid");
    if (tid !== "level-range-thumb-min" && tid !== "level-range-thumb-max") return;
    let delta = 0;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") delta = 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") delta = -1;
    else return;
    const isMin = tid === "level-range-thumb-min";
    let nextMin = minIdx;
    let nextMax = maxIdx;
    if (isMin) {
      nextMin = Math.max(0, Math.min(maxIdx, minIdx + delta));
    } else {
      nextMax = Math.max(minIdx, Math.min(LEVEL_ORDER.length - 1, maxIdx + delta));
    }
    if (nextMin === minIdx && nextMax === maxIdx) return;
    e.preventDefault();
    onChange({ min: LEVEL_ORDER[nextMin], max: LEVEL_ORDER[nextMax] });
  };

  return (
    <div
      className="level-range-slider"
      data-testid="level-range-slider"
      data-min={value.min}
      data-max={value.max}
      onKeyDown={onKeyDown}
    >
      <div className="level-range-readout" data-testid="level-range-readout">
        <span>Showing</span> <strong>{value.min}</strong> <span>to</span>{" "}
        <strong>{value.max}</strong>
      </div>
      <Slider
        range
        min={0}
        max={LEVEL_ORDER.length - 1}
        step={1}
        value={[minIdx, maxIdx]}
        onChange={handleSlider}
        marks={Object.fromEntries(LEVEL_ORDER.map((l, i) => [i, l]))}
        handleRender={(node, handleProps) =>
          cloneElement(node, {
            "data-testid":
              handleProps.index === 0
                ? "level-range-thumb-min"
                : "level-range-thumb-max",
          } as React.HTMLAttributes<HTMLDivElement>)
        }
      />
    </div>
  );
}
