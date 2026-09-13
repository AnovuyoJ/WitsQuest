import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, jest, test } from "@jest/globals";
import DeleteAccountPage from "../app/account/delete/page";
import { supabase } from "../lib/supabaseClient";

const originalFetch = globalThis.fetch;
afterEach(() => { cleanup(); jest.restoreAllMocks(); globalThis.fetch = originalFetch; });

test("deletion requires the confirmation phrase and preserves the session when deletion fails", async () => {
  jest.spyOn(supabase.auth, "getSession").mockResolvedValue({ data: { session: { access_token: "test-token" } }, error: null } as never);
  const signOut = jest.spyOn(supabase.auth, "signOut");
  const request = jest.fn<typeof fetch>().mockResolvedValue({ ok: false, status: 409, json: async () => ({ message: "Deletion could not be completed." }) } as Response);
  globalThis.fetch = request;
  render(<DeleteAccountPage />);
  const submit = screen.getByRole("button", { name: "Permanently delete account" });
  expect(submit).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Type DELETE to confirm"), { target: { value: "DELETE" } });
  fireEvent.click(submit);
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Deletion could not be completed."));
  expect(request).toHaveBeenCalledWith(expect.stringContaining("/api/me"), expect.objectContaining({ method: "DELETE", body: JSON.stringify({ confirmation: "DELETE" }) }));
  expect(signOut).not.toHaveBeenCalled();
  expect(submit).toBeEnabled();
});
