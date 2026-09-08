import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import ContentReview from "../components/ContentReview";
import { supabase } from "../lib/supabaseClient";

const originalFetch = globalThis.fetch;
const request = jest.fn<typeof fetch>();
const response = (body: unknown, status = 200) => ({ ok: status === 200, status, json: async () => body }) as Response;
const draft = { id: "test-id", title: "Review this title", draft_revision: 3, published_revision: null };
beforeEach(() => {
  request.mockReset(); globalThis.fetch = request;
  jest.spyOn(supabase.auth, "getSession").mockResolvedValue({ data: { session: { access_token: "test-token" } }, error: null } as never);
});
afterEach(() => { globalThis.fetch = originalFetch; jest.restoreAllMocks(); });

test("preview does not publish; review and publish are separate explicit actions", async () => {
  request.mockResolvedValue(response(draft));
  const published = jest.fn();
  render(<ContentReview kind="events" id="test-id" onPublished={published} />);
  fireEvent.click(screen.getByText("Review saved draft"));
  expect(await screen.findByText("Review this title")).not.toBeNull();
  expect(screen.queryByText("Publish reviewed content")).toBeNull();
  expect(request).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByText("I have reviewed this draft"));
  fireEvent.click(await screen.findByText("Publish reviewed content"));
  await waitFor(() => expect(published).toHaveBeenCalledTimes(1));
  expect(request).toHaveBeenNthCalledWith(2, expect.stringContaining("/admin/events/test-id/review"), expect.objectContaining({ method: "POST", body: JSON.stringify({ revision: 3 }) }));
  expect(request).toHaveBeenNthCalledWith(3, expect.stringContaining("/admin/events/test-id/publish"), expect.objectContaining({ method: "POST", body: JSON.stringify({ revision: 3 }) }));
});

test("stale review errors never show publication success", async () => {
  request.mockResolvedValueOnce(response(draft)).mockResolvedValueOnce(response(draft))
    .mockResolvedValueOnce(response({ message: "Review the latest saved draft before publishing." }, 409));
  const published = jest.fn();
  render(<ContentReview kind="challenges" id="test-id" onPublished={published} />);
  fireEvent.click(screen.getByText("Review saved draft"));
  fireEvent.click(await screen.findByText("I have reviewed this draft"));
  fireEvent.click(await screen.findByText("Publish reviewed content"));
  expect((await screen.findByRole("alert")).textContent).toContain("Review the latest saved draft");
  expect(published).not.toHaveBeenCalled();
  expect(screen.queryByText("Publish reviewed content")).toBeNull();
});
