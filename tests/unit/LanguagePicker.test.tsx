import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguagePicker } from "../../src/components/LanguagePicker";
import { LANGUAGES } from "../../src/data/languages";

describe("<LanguagePicker /> v1.1 dropdown row (AC 1, 16, v1.1-4, v1.1-5, v1.1-6)", () => {
  it("v1.1-4 — language <select>, level <select>, and Add button are siblings on a single row", () => {
    render(<LanguagePicker onAdd={() => {}} />);

    const langSelect = screen.getByTestId("language-picker-language");
    const levelSelect = screen.getByTestId("language-picker-level");
    const addBtn = screen.getByTestId("language-picker-add");

    // The language control is a <select>, not a search input.
    expect(langSelect.tagName).toBe("SELECT");
    expect(levelSelect.tagName).toBe("SELECT");
    expect(addBtn.tagName).toBe("BUTTON");

    // No search input should remain.
    expect(screen.queryByTestId("language-picker-search")).toBeNull();
    // No per-option list elements should remain.
    expect(
      document.querySelector('[data-testid^="language-option-"]'),
    ).toBeNull();

    // The three controls are siblings under a common parent (one row).
    expect(langSelect.parentElement).toBe(levelSelect.parentElement);
    expect(levelSelect.parentElement).toBe(addBtn.parentElement);
  });

  it("v1.1-5 — language <select> contains every seed language exactly once, alphabetical (case-insensitive)", () => {
    render(<LanguagePicker onAdd={() => {}} />);
    const langSelect = screen.getByTestId(
      "language-picker-language",
    ) as HTMLSelectElement;

    // All real options (excluding any blank/placeholder option that has empty value).
    const realOptions = Array.from(langSelect.options).filter(
      (o) => o.value !== "",
    );

    // One option per seed language.
    expect(realOptions).toHaveLength(LANGUAGES.length);

    const labels = realOptions.map((o) => o.textContent ?? "");
    const sorted = [...labels].sort((a, b) =>
      a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase()),
    );
    expect(labels).toEqual(sorted);

    // Each LANGUAGES.id appears exactly once as an option value.
    const values = realOptions.map((o) => o.value).sort();
    const expected = LANGUAGES.map((l) => l.id).sort();
    expect(values).toEqual(expected);
  });

  it("AC 1 — selecting a language + level and clicking Add emits the new UserLanguage", async () => {
    const onAdd = vi.fn();
    render(<LanguagePicker onAdd={onAdd} />);

    const langSelect = screen.getByTestId("language-picker-language");
    const levelSelect = screen.getByTestId("language-picker-level");
    const addBtn = screen.getByTestId("language-picker-add");

    const user = userEvent.setup();
    await user.selectOptions(langSelect, "spa");
    await user.selectOptions(levelSelect, "B2");
    await user.click(addBtn);

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith({ id: "spa", level: "B2" });
  });

  it("v1.1-6 / AC 16 — picking the same language at a new level emits onAdd with the new level (App reducer dedups)", async () => {
    const onAdd = vi.fn();
    render(<LanguagePicker onAdd={onAdd} />);

    const langSelect = screen.getByTestId("language-picker-language");
    const levelSelect = screen.getByTestId("language-picker-level");
    const addBtn = screen.getByTestId("language-picker-add");

    const user = userEvent.setup();
    await user.selectOptions(langSelect, "spa");
    await user.selectOptions(levelSelect, "C1");
    await user.click(addBtn);

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith({ id: "spa", level: "C1" });
  });

  it("the language <select> has option values equal to the language id (e.g. 'spa' for Spanish)", () => {
    render(<LanguagePicker onAdd={() => {}} />);
    const langSelect = screen.getByTestId(
      "language-picker-language",
    ) as HTMLSelectElement;

    const spanishOption = within(langSelect).getByRole("option", {
      name: "Spanish",
    }) as HTMLOptionElement;
    expect(spanishOption.value).toBe("spa");

    const frenchOption = within(langSelect).getByRole("option", {
      name: "French",
    }) as HTMLOptionElement;
    expect(frenchOption.value).toBe("fra");
  });
});
