import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, jest, test } from "@jest/globals";
import Stepper, { Step } from "@/components/Stepper";

test("browses the guide using indicators and buttons and completes once", async () => {
  const complete = jest.fn();
  render(<Stepper stepLabels={["Find", "Answer", "Collect"]} nextButtonText="Next" finalButtonText="Create my account" onFinalStepCompleted={complete}>
    <Step><h3>Find a quest</h3></Step>
    <Step><h3>Answer trivia</h3></Step>
    <Step><h3>Collect a card</h3></Step>
  </Stepper>);
  expect(screen.getByRole("button", { name: "Find" }).getAttribute("aria-current")).toBe("step");
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Answer" }).getAttribute("aria-current")).toBe("step"));
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByRole("button", { name: "Find" }).getAttribute("aria-current")).toBe("step");
  fireEvent.click(screen.getByRole("button", { name: "Collect" }));
  await screen.findByRole("heading", { name: "Collect a card" });
  fireEvent.click(screen.getByRole("button", { name: "Create my account" }));
  expect(complete).toHaveBeenCalledTimes(1);
});
