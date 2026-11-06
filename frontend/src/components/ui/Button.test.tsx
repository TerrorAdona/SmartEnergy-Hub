import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("disables itself while loading and retains its label", () => {
    render(
      <Button loading onClick={vi.fn()}>
        Save
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(button).toBeDisabled();
  });
});
