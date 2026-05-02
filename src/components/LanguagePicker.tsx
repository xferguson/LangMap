import { useMemo, useState } from "react";
import type { Level, UserLanguage } from "../types";
import { LANGUAGES } from "../data/languages";
import { LEVEL_ORDER } from "../lib/levels";

interface Props {
  onAdd: (ul: UserLanguage) => void;
}

export function LanguagePicker({ onAdd }: Props) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [level, setLevel] = useState<Level>("B1");

  const sorted = useMemo(
    () =>
      [...LANGUAGES].sort((a, b) =>
        a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()),
      ),
    [],
  );

  const canAdd = selectedId !== "" && level !== ("" as Level);

  return (
    <div className="language-picker-row">
      <select
        data-testid="language-picker-language"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        <option value="">Select a language…</option>
        {sorted.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
      <select
        data-testid="language-picker-level"
        value={level}
        onChange={(e) => setLevel(e.target.value as Level)}
      >
        {LEVEL_ORDER.map((lvl) => (
          <option key={lvl} value={lvl}>
            {lvl}
          </option>
        ))}
      </select>
      <button
        data-testid="language-picker-add"
        disabled={!canAdd}
        onClick={() => {
          if (selectedId !== "") {
            onAdd({ id: selectedId, level });
            setSelectedId("");
          }
        }}
      >
        Add
      </button>
    </div>
  );
}
