import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import ChallengeCard from "../components/ChallengeCard";
import { supabase } from "../lib/supabaseClient";

const originalFetch = globalThis.fetch;
const request = jest.fn<typeof fetch>();
const response = (data: unknown) => ({ ok: true, json: async () => data }) as Response;
beforeEach(() => {
  request.mockReset(); globalThis.fetch = request;
  jest.spyOn(supabase.auth, "getSession").mockResolvedValue({ data: { session: { access_token: "token" } }, error: null } as never);
});
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; jest.restoreAllMocks(); });

test.each([
  { correct: true, cardAwarded: true, alreadyCompleted: false, reveal: true },
  { correct: false, cardAwarded: false, alreadyCompleted: false, reveal: false },
  { correct: true, cardAwarded: false, alreadyCompleted: true, reveal: false },
])("reward reveal follows the server result: %j", async result => {
  request.mockResolvedValueOnce(response({ id: "question", event_id: "event", question_text: "Ready?", question_type: "true_false", options: null, card_id: "card" }))
    .mockResolvedValueOnce(response({ ...result, correctAnswer: "True" }))
    .mockResolvedValueOnce(response([{ id: "card", title: "Campus Explorer", rarity: "Gold", points: 60 }]));
  render(<ChallengeCard eventId="event" />);
  fireEvent.click(await screen.findByText("True"));
  fireEvent.click(screen.getByText("Lock in answer"));
  await screen.findByText("Challenge result");
  if (result.reveal) {
    expect(await screen.findByText("Campus Explorer")).not.toBeNull();
    expect(screen.getByText("60 card points")).not.toBeNull();
  } else {
    expect(screen.queryByText("New card earned!")).toBeNull();
    expect(request).toHaveBeenCalledTimes(2);
  }
});
