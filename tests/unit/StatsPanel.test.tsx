import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatsPanel } from "../../src/components/StatsPanel";
import {
  countriesAtOrAbove,
  populationAtOrAbove,
} from "../../src/lib/stats";
import {
  SPANISH_NATIVE_ENGLISH_A2_CATALAN_B2,
  makeState,
  userLang,
} from "./fixtures/states";

describe("<StatsPanel /> (AC 6, 7, 8, 9, 12)", () => {
  it("renders the two cards: Communicate (B1+) and Get by (A1+)", () => {
    render(<StatsPanel state={makeState([userLang("spa", "Native")])} />);
    expect(screen.getByTestId("stats-communicate")).toBeInTheDocument();
    expect(screen.getByTestId("stats-getby")).toBeInTheDocument();
  });

  it("AC 6 — Communicate (B1+) country count matches countriesAtOrAbove B1", () => {
    const state = SPANISH_NATIVE_ENGLISH_A2_CATALAN_B2;
    render(<StatsPanel state={state} />);
    const expected = String(countriesAtOrAbove(state, "B1"));
    const countEl = screen.getByTestId("stats-communicate-count");
    expect(countEl).toHaveTextContent(expected);
  });

  it("AC 8 — Get by (A1+) count is greater than or equal to Communicate (B1+) count", () => {
    const state = SPANISH_NATIVE_ENGLISH_A2_CATALAN_B2;
    render(<StatsPanel state={state} />);
    const a1 = Number(screen.getByTestId("stats-getby-count").textContent);
    const b1 = Number(screen.getByTestId("stats-communicate-count").textContent);
    expect(a1).toBeGreaterThanOrEqual(b1);
  });

  it("AC 7 — Communicate (B1+) population % matches the formula formatted with one decimal", () => {
    const state = SPANISH_NATIVE_ENGLISH_A2_CATALAN_B2;
    render(<StatsPanel state={state} />);
    const expected = (populationAtOrAbove(state, "B1") * 100).toFixed(1) + "%";
    expect(screen.getByTestId("stats-communicate-pop")).toHaveTextContent(
      expected,
    );
  });

  it("AC 7 — Get by (A1+) population % matches the formula formatted with one decimal", () => {
    const state = SPANISH_NATIVE_ENGLISH_A2_CATALAN_B2;
    render(<StatsPanel state={state} />);
    const expected = (populationAtOrAbove(state, "A1") * 100).toFixed(1) + "%";
    expect(screen.getByTestId("stats-getby-pop")).toHaveTextContent(expected);
  });

  it("AC 9 — hovering the ⓘ icon reveals an overlap-disclaimer tooltip", async () => {
    render(<StatsPanel state={SPANISH_NATIVE_ENGLISH_A2_CATALAN_B2} />);
    const info = screen.getByTestId("stats-communicate-info");
    const user = userEvent.setup();
    await user.hover(info);
    const tooltip = await screen.findByTestId("stats-communicate-tooltip");
    expect(tooltip).toHaveTextContent(/overlap|bilingual|deduplicate/i);
  });

  it("AC 12 — narrowing the filter range does not change the rendered counts or percentages", () => {
    const wide = makeState(
      [
        userLang("spa", "Native"),
        userLang("eng", "A2"),
        userLang("cat", "B2"),
      ],
      "A1",
      "Native",
    );
    const narrow = {
      ...wide,
      filter: { min: "B2" as const, max: "C1" as const },
    };

    const { rerender } = render(<StatsPanel state={wide} />);
    const wideCount = screen.getByTestId("stats-communicate-count").textContent;
    const widePop = screen.getByTestId("stats-communicate-pop").textContent;
    const wideGetByCount = screen.getByTestId("stats-getby-count").textContent;
    const wideGetByPop = screen.getByTestId("stats-getby-pop").textContent;

    rerender(<StatsPanel state={narrow} />);
    expect(screen.getByTestId("stats-communicate-count").textContent).toBe(
      wideCount,
    );
    expect(screen.getByTestId("stats-communicate-pop").textContent).toBe(
      widePop,
    );
    expect(screen.getByTestId("stats-getby-count").textContent).toBe(
      wideGetByCount,
    );
    expect(screen.getByTestId("stats-getby-pop").textContent).toBe(wideGetByPop);
  });
});
