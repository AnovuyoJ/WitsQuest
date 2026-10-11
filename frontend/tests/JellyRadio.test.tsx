import { fireEvent, render, screen } from "@testing-library/react";
import { expect, jest, test } from "@jest/globals";
import JellyRadio from "@/components/JellyRadio";

test("activates the current destination again and navigates with the keyboard", () => {
  Object.defineProperty(globalThis, "ResizeObserver", { configurable: true, value: class {
    observe() {}
    disconnect() {}
  } });
  const navigate = jest.fn();
  render(<JellyRadio items={["Explore campus", "How it works", "Your collection"]} onChange={navigate} />);
  fireEvent.click(screen.getByRole("radio", { name: "Explore campus" }));
  expect(navigate).toHaveBeenLastCalledWith("Explore campus", 0);
  fireEvent.keyDown(screen.getByRole("radio", { name: "Explore campus" }), { key: "ArrowRight" });
  const guide = screen.getByRole("radio", { name: "How it works" });
  expect(guide.getAttribute("aria-checked")).toBe("true");
  expect(document.activeElement).toBe(guide);
  expect(navigate).toHaveBeenLastCalledWith("How it works", 1);
});
