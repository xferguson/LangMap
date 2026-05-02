import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../src/App";

const KEY = "langmap.v1";

describe("<App /> persistence integration (AC 14, 15)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("AC 14 — hydrates languages and filter from localStorage on mount", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        languages: [
          { id: "spa", level: "Native" },
          { id: "eng", level: "B1" },
        ],
        filter: { min: "B1", max: "C2" },
      }),
    );

    render(<App />);

    expect(screen.getByTestId("language-row-spa")).toBeInTheDocument();
    expect(screen.getByTestId("language-row-eng")).toBeInTheDocument();
    const slider = screen.getByTestId("level-range-slider");
    expect(slider).toHaveAttribute("data-min", "B1");
    expect(slider).toHaveAttribute("data-max", "C2");
  });

  it("AC 15 — corrupted localStorage value falls back to default empty state", () => {
    localStorage.setItem(KEY, "{not valid json");
    render(<App />);

    expect(screen.queryByTestId("language-row-spa")).not.toBeInTheDocument();
    const slider = screen.getByTestId("level-range-slider");
    expect(slider).toHaveAttribute("data-min", "A1");
    expect(slider).toHaveAttribute("data-max", "Native");
  });

  it("AC 15 — schema-mismatched localStorage value falls back to defaults", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ languages: "oops", filter: { min: "A1", max: "Native" } }),
    );
    render(<App />);
    // No language rows render
    expect(screen.queryByTestId("language-row-spa")).not.toBeInTheDocument();
    // And the slider is mounted at the default range
    const slider = screen.getByTestId("level-range-slider");
    expect(slider).toHaveAttribute("data-min", "A1");
    expect(slider).toHaveAttribute("data-max", "Native");
  });

  it("renders the four core regions: map, picker, list, stats, slider", () => {
    render(<App />);
    expect(screen.getByTestId("world-map")).toBeInTheDocument();
    expect(screen.getByTestId("language-picker-language")).toBeInTheDocument();
    expect(screen.getByTestId("stats-communicate")).toBeInTheDocument();
    expect(screen.getByTestId("level-range-slider")).toBeInTheDocument();
  });
});

describe("<App /> v1.1-2 single side panel layout", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("v1.1-2 — exactly one element with data-testid=\"side-panel\" exists", () => {
    render(<App />);
    const panels = screen.getAllByTestId("side-panel");
    expect(panels).toHaveLength(1);
  });

  it("v1.1-2 — the side panel contains the language picker, language list, stats panel, and level range slider", () => {
    render(<App />);
    const panel = screen.getByTestId("side-panel");

    // The four control roots must be descendants of the side panel.
    expect(within(panel).getByTestId("language-picker-language")).toBeInTheDocument();
    expect(within(panel).getByTestId("language-picker-level")).toBeInTheDocument();
    expect(within(panel).getByTestId("language-picker-add")).toBeInTheDocument();
    expect(within(panel).getByTestId("stats-communicate")).toBeInTheDocument();
    expect(within(panel).getByTestId("stats-getby")).toBeInTheDocument();
    expect(within(panel).getByTestId("level-range-slider")).toBeInTheDocument();
  });

  it("v1.1-2 — the world map is NOT inside the side panel (map fills main area)", () => {
    render(<App />);
    const panel = screen.getByTestId("side-panel");
    const map = screen.getByTestId("world-map");
    expect(panel.contains(map)).toBe(false);
  });

  it("v1.2-2 — the side panel is the FIRST child of <main> (panel on the left)", () => {
    render(<App />);
    const panel = screen.getByTestId("side-panel");
    const main = panel.closest("main");
    expect(main).not.toBeNull();
    // The panel is the first child of <main> under the v1.2 left-side layout.
    expect(main!.firstElementChild).toBe(panel);
  });
});

describe("<App /> v1.3-6 — side panel sections", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("v1.3-6 — the four panel-section testids exist inside the side panel", () => {
    render(<App />);
    const panel = screen.getByTestId("side-panel");
    expect(within(panel).getByTestId("panel-section-add")).toBeInTheDocument();
    expect(within(panel).getByTestId("panel-section-list")).toBeInTheDocument();
    expect(within(panel).getByTestId("panel-section-stats")).toBeInTheDocument();
    expect(within(panel).getByTestId("panel-section-filter")).toBeInTheDocument();
  });

  it("v1.3-6 — the four sections appear in DOM order: add, list, stats, filter", () => {
    render(<App />);
    const panel = screen.getByTestId("side-panel");
    const add = within(panel).getByTestId("panel-section-add");
    const list = within(panel).getByTestId("panel-section-list");
    const stats = within(panel).getByTestId("panel-section-stats");
    const filter = within(panel).getByTestId("panel-section-filter");

    // compareDocumentPosition: bit 4 = node argument follows the reference node.
    const FOLLOWING = Node.DOCUMENT_POSITION_FOLLOWING;
    expect(add.compareDocumentPosition(list) & FOLLOWING).toBeTruthy();
    expect(list.compareDocumentPosition(stats) & FOLLOWING).toBeTruthy();
    expect(stats.compareDocumentPosition(filter) & FOLLOWING).toBeTruthy();
  });

  it("v1.3-6 — each section contains its expected child component", () => {
    render(<App />);
    const panel = screen.getByTestId("side-panel");

    const add = within(panel).getByTestId("panel-section-add");
    expect(within(add).getByTestId("language-picker-language")).toBeInTheDocument();
    expect(within(add).getByTestId("language-picker-level")).toBeInTheDocument();
    expect(within(add).getByTestId("language-picker-add")).toBeInTheDocument();

    const stats = within(panel).getByTestId("panel-section-stats");
    expect(within(stats).getByTestId("stats-communicate")).toBeInTheDocument();
    expect(within(stats).getByTestId("stats-getby")).toBeInTheDocument();

    const filter = within(panel).getByTestId("panel-section-filter");
    expect(within(filter).getByTestId("level-range-slider")).toBeInTheDocument();
  });
});

describe("<App /> duplicate-language guard (AC 16 / v1.1-6)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("v1.1-6 — adding the same language twice through the new dropdown replaces the level (no duplicate row)", async () => {
    render(<App />);

    const langSelect = screen.getByTestId("language-picker-language");
    const levelSelect = screen.getByTestId("language-picker-level");
    const addBtn = screen.getByTestId("language-picker-add");
    const user = userEvent.setup();

    await user.selectOptions(langSelect, "spa");
    await user.selectOptions(levelSelect, "B1");
    await user.click(addBtn);

    await user.selectOptions(langSelect, "spa");
    await user.selectOptions(levelSelect, "C1");
    await user.click(addBtn);

    const rows = screen.getAllByTestId("language-row-spa");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent("C1");
    expect(rows[0]).not.toHaveTextContent("B1");
  });
});
