import { describe, it, expect, beforeEach } from "vitest";
import { loadState, saveState } from "../../src/lib/persistence";
import { makeState, userLang } from "./fixtures/states";

const KEY = "langmap.v1";

describe("persistence (AC 14, 15)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("AC 14 — saveState then loadState round-trips the AppState", () => {
    const state = makeState(
      [userLang("spa", "Native"), userLang("eng", "B1")],
      "B1",
      "C2",
    );
    saveState(state);
    const loaded = loadState();
    expect(loaded).toEqual(state);
  });

  it("AC 14 — saveState writes under key 'langmap.v1'", () => {
    const state = makeState([userLang("spa", "B2")]);
    saveState(state);
    const raw = localStorage.getItem(KEY);
    expect(raw, "saveState must write to langmap.v1").toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.languages).toEqual([{ id: "spa", level: "B2" }]);
    expect(parsed.filter).toEqual({ min: "A1", max: "Native" });
  });

  it("AC 15 — returns default empty state when storage is empty", () => {
    const loaded = loadState();
    expect(loaded.languages).toEqual([]);
    expect(loaded.filter).toEqual({ min: "A1", max: "Native" });
  });

  it("AC 15 — returns defaults when JSON is corrupt", () => {
    localStorage.setItem(KEY, "{not valid json");
    const loaded = loadState();
    expect(loaded.languages).toEqual([]);
    expect(loaded.filter).toEqual({ min: "A1", max: "Native" });
  });

  it("AC 15 — returns defaults on schema mismatch (languages is not an array)", () => {
    localStorage.setItem(KEY, JSON.stringify({ languages: "oops", filter: { min: "A1", max: "Native" } }));
    const loaded = loadState();
    expect(loaded.languages).toEqual([]);
  });

  it("AC 15 — returns defaults on schema mismatch (filter is missing)", () => {
    localStorage.setItem(KEY, JSON.stringify({ languages: [] }));
    const loaded = loadState();
    expect(loaded.filter).toEqual({ min: "A1", max: "Native" });
  });

  it("AC 15 — returns defaults on schema mismatch (filter has invalid level)", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ languages: [], filter: { min: "Z9", max: "Native" } }),
    );
    const loaded = loadState();
    expect(loaded.filter).toEqual({ min: "A1", max: "Native" });
  });

  it("AC 15 — returns defaults on schema mismatch (a language entry has invalid level)", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        languages: [{ id: "spa", level: "Fluent" }],
        filter: { min: "A1", max: "Native" },
      }),
    );
    const loaded = loadState();
    expect(loaded.languages).toEqual([]);
  });
});
