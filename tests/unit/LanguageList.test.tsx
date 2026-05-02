import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageList } from "../../src/components/LanguageList";
import { makeState, userLang } from "./fixtures/states";

describe("<LanguageList /> (AC 13)", () => {
  it("renders a row per user language with name and level", () => {
    const state = makeState([userLang("spa", "Native"), userLang("eng", "B1")]);
    render(<LanguageList state={state} onRemove={() => {}} />);

    expect(screen.getByTestId("language-row-spa")).toBeInTheDocument();
    expect(screen.getByTestId("language-row-eng")).toBeInTheDocument();
    const spaRow = screen.getByTestId("language-row-spa");
    expect(spaRow).toHaveTextContent(/spanish/i);
    expect(spaRow).toHaveTextContent("Native");
  });

  it("AC 13 — clicking the remove button on a row calls onRemove with that id", async () => {
    const onRemove = vi.fn();
    const state = makeState([userLang("spa", "Native"), userLang("eng", "B1")]);
    render(<LanguageList state={state} onRemove={onRemove} />);

    const removeBtn = screen.getByTestId("language-row-remove-spa");
    const user = userEvent.setup();
    await user.click(removeBtn);

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith("spa");
  });

  it("renders nothing user-facing when the list is empty", () => {
    render(<LanguageList state={makeState([])} onRemove={() => {}} />);
    expect(screen.queryByTestId("language-row-spa")).not.toBeInTheDocument();
    expect(screen.queryByTestId("language-row-eng")).not.toBeInTheDocument();
  });
});
