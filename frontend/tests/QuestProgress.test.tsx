import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, test } from "@jest/globals";
import QuestProgress from "../components/QuestProgress";

afterEach(cleanup);
test("shows actual question progress and reward details", () => {
  render(<QuestProgress summary={{ event_id: "quest", total_questions: 4, completed_questions: 2, rewards: [{ id: "card", title: "Library Explorer", rarity: "Gold", points: 60 }] }} />);
  expect(screen.getByRole("progressbar").getAttribute("value")).toBe("2");
  expect(screen.getByRole("progressbar").getAttribute("max")).toBe("4");
  expect(screen.getByText("Library Explorer")).not.toBeNull();
  expect(screen.getByText("Gold rarity · 60 card points")).not.toBeNull();
  expect(screen.queryByText("Quest completed")).toBeNull();
});
test("empty quests are not marked completed", () => {
  render(<QuestProgress summary={{ event_id: "quest", total_questions: 0, completed_questions: 0, rewards: [] }} />);
  expect(screen.queryByRole("progressbar")).toBeNull();
  expect(screen.getByText("Questions are coming soon.")).not.toBeNull();
  expect(screen.queryByText("Quest completed")).toBeNull();
});
