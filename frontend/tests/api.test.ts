import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { apiRequest } from "../lib/api";
import { supabase } from "../lib/supabaseClient";

const originalFetch = globalThis.fetch;
afterEach(() => { jest.restoreAllMocks(); globalThis.fetch = originalFetch; });

describe("handwritten API client", () => {
  it("sends the session token and answer to Express", async () => {
    jest.spyOn(supabase.auth, "getSession").mockResolvedValue({ data: { session: { access_token: "session-token" } }, error: null } as never);
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue({ ok: true, json: async () => ({ correct: true }) } as Response);
    globalThis.fetch = fetchMock;
    const result = await apiRequest("/events/test/submit-answer", "POST", { challengeId: "question", answer: "Yes" });
    expect(result.data).toEqual({ correct: true });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/api\/events\/test\/submit-answer$/), expect.objectContaining({
      method: "POST", headers: { Authorization: "Bearer session-token", "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId: "question", answer: "Yes" }),
    }));
  });

  it("does not issue a data request without a session", async () => {
    jest.spyOn(supabase.auth, "getSession").mockResolvedValue({ data: { session: null }, error: null } as never);
    const fetchMock = jest.fn<typeof fetch>(); globalThis.fetch = fetchMock;
    expect((await apiRequest("/me/cards")).error?.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves authorization failures and handles network failures", async () => {
    jest.spyOn(supabase.auth, "getSession").mockResolvedValue({ data: { session: { access_token: "token" } }, error: null } as never);
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({ message: "Administrator access required." }) } as Response)
      .mockRejectedValueOnce(new Error("Offline"));
    globalThis.fetch = fetchMock;
    expect((await apiRequest("/admin/cards")).error).toMatchObject({ status: 403, message: "Administrator access required." });
    expect((await apiRequest("/me/cards")).error?.message).toContain("Could not reach");
  });

  it("exposes no Supabase data query methods", () => {
    expect(supabase).not.toHaveProperty("from");
    expect(supabase).not.toHaveProperty("rpc");
  });
});
