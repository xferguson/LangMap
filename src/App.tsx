import { useEffect, useState } from "react";
import type { AppState, UserLanguage } from "./types";
import { loadState, saveState } from "./lib/persistence";
import { WorldMap } from "./components/WorldMap";
import { LanguagePicker } from "./components/LanguagePicker";
import { LanguageList } from "./components/LanguageList";
import { StatsPanel } from "./components/StatsPanel";
import { LevelRangeSlider } from "./components/LevelRangeSlider";
import { DrawerToggle } from "./components/DrawerToggle";

export function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const addLanguage = (ul: UserLanguage) => {
    setState((s) => {
      const exists = s.languages.some((l) => l.id === ul.id);
      const languages = exists
        ? s.languages.map((l) => (l.id === ul.id ? ul : l))
        : [...s.languages, ul];
      return { ...s, languages };
    });
  };

  const removeLanguage = (id: string) => {
    setState((s) => ({
      ...s,
      languages: s.languages.filter((l) => l.id !== id),
    }));
  };

  const drawerState = drawerOpen ? "open" : "closed";

  return (
    <main className="app">
      <aside
        data-testid="side-panel"
        className="side-panel"
        data-state={drawerState}
      >
        <button
          type="button"
          className="drawer-close"
          data-testid="drawer-close"
          aria-label="Close menu"
          onClick={() => setDrawerOpen(false)}
        >
          ×
        </button>
        <section data-testid="panel-section-add" className="panel-section">
          <h2>Add a language</h2>
          <LanguagePicker onAdd={addLanguage} />
        </section>
        <section data-testid="panel-section-list" className="panel-section">
          <h2>Your languages</h2>
          <LanguageList state={state} onRemove={removeLanguage} />
        </section>
        <section data-testid="panel-section-stats" className="panel-section">
          <h2>Stats</h2>
          <StatsPanel state={state} />
        </section>
        <section data-testid="panel-section-filter" className="panel-section">
          <h2>Filter by level</h2>
          <LevelRangeSlider
            value={state.filter}
            onChange={(filter) => setState((s) => ({ ...s, filter }))}
          />
        </section>
      </aside>
      <DrawerToggle
        open={drawerOpen}
        onClick={() => setDrawerOpen((v) => !v)}
      />
      <div
        data-testid="drawer-overlay"
        className="drawer-overlay"
        data-state={drawerState}
        onClick={() => setDrawerOpen(false)}
      />
      <WorldMap state={state} />
    </main>
  );
}
