import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LevelRangeSlider } from "../../src/components/LevelRangeSlider";
import type { Level } from "../../src/types";

describe("<LevelRangeSlider /> v1.4-5 — slider readout + thumb testids", () => {
  it("renders root with the value passed in via props", () => {
    render(
      <LevelRangeSlider
        value={{ min: "A1", max: "Native" }}
        onChange={() => {}}
      />,
    );
    const root = screen.getByTestId("level-range-slider");
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute("data-min", "A1");
    expect(root).toHaveAttribute("data-max", "Native");
  });

  it("reflects a different value when re-rendered", () => {
    const { rerender } = render(
      <LevelRangeSlider
        value={{ min: "A1", max: "Native" }}
        onChange={() => {}}
      />,
    );
    rerender(
      <LevelRangeSlider value={{ min: "B1", max: "C2" }} onChange={() => {}} />,
    );
    const root = screen.getByTestId("level-range-slider");
    expect(root).toHaveAttribute("data-min", "B1");
    expect(root).toHaveAttribute("data-max", "C2");
  });

  it("v1.4-5 — exposes a level-range-readout element showing the current min/max labels (default A1 to Native)", () => {
    render(
      <LevelRangeSlider
        value={{ min: "A1", max: "Native" }}
        onChange={() => {}}
      />,
    );
    const readout = screen.getByTestId("level-range-readout");
    expect(readout).toBeInTheDocument();
    // Text should match a "Showing A1 to Native"-style readout.
    expect(readout.textContent ?? "").toMatch(/A1.*Native/i);
  });

  it("v1.4-5 — readout updates when value prop changes", () => {
    const { rerender } = render(
      <LevelRangeSlider
        value={{ min: "A1", max: "Native" }}
        onChange={() => {}}
      />,
    );
    rerender(
      <LevelRangeSlider value={{ min: "B1", max: "C2" }} onChange={() => {}} />,
    );
    const readout = screen.getByTestId("level-range-readout");
    expect(readout.textContent ?? "").toMatch(/B1.*C2/i);
  });

  it("v1.4-5 — slider thumbs carry data-testid=\"level-range-thumb-min\" and \"-thumb-max\"", () => {
    render(
      <LevelRangeSlider
        value={{ min: "A1", max: "Native" }}
        onChange={() => {}}
      />,
    );
    const thumbMin = screen.getByTestId("level-range-thumb-min");
    const thumbMax = screen.getByTestId("level-range-thumb-max");
    expect(thumbMin).toBeInTheDocument();
    expect(thumbMax).toBeInTheDocument();
  });

  it("v1.4-5 — keyboard ArrowRight on the min thumb fires onChange with the next-higher min", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <LevelRangeSlider value={{ min: "A1", max: "Native" }} onChange={onChange} />,
    );

    const thumbMin = screen.getByTestId("level-range-thumb-min");
    // Focus the min thumb and press ArrowRight to bump it from A1 → A2.
    thumbMin.focus();
    await user.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as {
      min: Level;
      max: Level;
    };
    // Next-higher min after A1 is A2; max stays at Native.
    expect(lastCall.min).toBe("A2");
    expect(lastCall.max).toBe("Native");
  });
});
