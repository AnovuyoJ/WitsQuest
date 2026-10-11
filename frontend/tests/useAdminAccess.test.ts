import { act, renderHook, waitFor } from '@testing-library/react';
import { useAdminAccess } from '../lib/useAdminAccess';
import { getAdminAccess } from '../lib/api';
import { supabase } from '../lib/supabaseClient';
jest.mock('../lib/api', () => ({ getAdminAccess: jest.fn() }));
jest.mock('../lib/supabaseClient', () => ({ supabase: { auth: { onAuthStateChange: jest.fn() } } }));
const unsubscribe = jest.fn();
let authChanged: () => void;
beforeEach(() => {
  jest.resetAllMocks();
  (getAdminAccess as jest.Mock).mockResolvedValue(false);
  (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation(callback => {
    authChanged = callback;
    return { data: { subscription: { unsubscribe } } };
  });
});
test('checks access, updates after authentication changes and unsubscribes on unmount', async () => {
  const { result, unmount } = renderHook(() => useAdminAccess());
  expect(result.current.checkingAccess).toBe(true);
  await waitFor(() => expect(result.current).toEqual({ checkingAccess: false, isAdmin: false }));
  (getAdminAccess as jest.Mock).mockResolvedValue(true);
  act(() => authChanged());
  await waitFor(() => expect(result.current.isAdmin).toBe(true));
  unmount(); expect(unsubscribe).toHaveBeenCalledTimes(1);
});
test('an older access response cannot overwrite a newer authentication check', async () => {
  let finishOld!: (value: boolean) => void;
  (getAdminAccess as jest.Mock).mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; }));
  const { result } = renderHook(() => useAdminAccess());
  (getAdminAccess as jest.Mock).mockResolvedValue(true);
  act(() => authChanged());
  await waitFor(() => expect(result.current.isAdmin).toBe(true));
  await act(async () => finishOld(false));
  expect(result.current.isAdmin).toBe(true);
});
