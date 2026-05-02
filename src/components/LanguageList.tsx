import type { AppState } from "../types";
import { LANGUAGES } from "../data/languages";

interface Props {
  state: AppState;
  onRemove: (id: string) => void;
}

export function LanguageList({ state, onRemove }: Props) {
  return (
    <ul className="language-list">
      {state.languages.map((ul) => {
        const lang = LANGUAGES.find((l) => l.id === ul.id);
        const name = lang ? lang.name : ul.id;
        return (
          <li
            key={ul.id}
            data-testid={`language-row-${ul.id}`}
            className="language-row"
          >
            <span className="language-row-name">{name}</span>
            <span className="level-badge">{ul.level}</span>
            <button
              data-testid={`language-row-remove-${ul.id}`}
              className="language-row-remove"
              onClick={() => onRemove(ul.id)}
              aria-label={`Remove ${name}`}
            >
              ×
            </button>
          </li>
        );
      })}
    </ul>
  );
}
