import { useState } from "react";
import type { AppState } from "../types";
import {
  COMMUNICATE_THRESHOLD,
  GETBY_THRESHOLD,
} from "../lib/levels";
import { countriesAtOrAbove, populationAtOrAbove } from "../lib/stats";

interface Props {
  state: AppState;
}

function formatPct(ratio: number): string {
  return (ratio * 100).toFixed(1) + "%";
}

const TOOLTIP_TEXT =
  "Population % does not deduplicate overlap from bilingual speakers; figures sum L1 + L2 across qualifying languages.";

export function StatsPanel({ state }: Props) {
  const [hover, setHover] = useState<"communicate" | "getby" | null>(null);

  const cCount = countriesAtOrAbove(state, COMMUNICATE_THRESHOLD);
  const cPop = formatPct(populationAtOrAbove(state, COMMUNICATE_THRESHOLD));
  const gCount = countriesAtOrAbove(state, GETBY_THRESHOLD);
  const gPop = formatPct(populationAtOrAbove(state, GETBY_THRESHOLD));

  return (
    <div className="stats-grid">
      <div data-testid="stats-communicate" className="stats-card">
        <span className="stats-card-count" data-testid="stats-communicate-count">
          {cCount}
        </span>
        <span className="stats-card-label">Communicate B1+</span>
        <span className="stats-card-pop">
          <span data-testid="stats-communicate-pop">{cPop}</span> of world
          <span
            data-testid="stats-communicate-info"
            onMouseEnter={() => setHover("communicate")}
            onMouseLeave={() => setHover(null)}
            style={{ marginLeft: 4, cursor: "help" }}
          >
            ⓘ
          </span>
          {hover === "communicate" && (
            <span data-testid="stats-communicate-tooltip" role="tooltip">
              {TOOLTIP_TEXT}
            </span>
          )}
        </span>
      </div>
      <div data-testid="stats-getby" className="stats-card">
        <span className="stats-card-count" data-testid="stats-getby-count">
          {gCount}
        </span>
        <span className="stats-card-label">Get by A1+</span>
        <span className="stats-card-pop">
          <span data-testid="stats-getby-pop">{gPop}</span> of world
          <span
            data-testid="stats-getby-info"
            onMouseEnter={() => setHover("getby")}
            onMouseLeave={() => setHover(null)}
            style={{ marginLeft: 4, cursor: "help" }}
          >
            ⓘ
          </span>
          {hover === "getby" && (
            <span data-testid="stats-getby-tooltip" role="tooltip">
              {TOOLTIP_TEXT}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
