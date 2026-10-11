import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LogoutButton from '../components/LogoutButton';
import { signOut } from '../lib/authService';
import { clearOfflineDataForOwner } from '../lib/offlineDb';
import { supabase } from '../lib/supabaseClient';

const push = jest.fn();
const refresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }));
jest.mock('../lib/authService', () => ({ signOut: jest.fn() }));
jest.mock('../lib/offlineDb', () => ({ clearOfflineDataForOwner: jest.fn() }));
jest.mock('../lib/supabaseClient', () => ({ supabase: { auth: { getSession: jest.fn() } } }));

beforeEach(() => {
  jest.clearAllMocks();
  (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: { user: { id: 'player' } } } });
  (signOut as jest.Mock).mockResolvedValue({ error: null });
  (clearOfflineDataForOwner as jest.Mock).mockResolvedValue(undefined);
});

test('logout clears only the current player cache and redirects to login', async () => {
  render(<LogoutButton collapsed={false} />);
  fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
  expect(screen.getByRole('button')).toBeDisabled();
  await waitFor(() => expect(push).toHaveBeenCalledWith('/Login'));
  expect(clearOfflineDataForOwner).toHaveBeenCalledWith('player');
  expect(refresh).toHaveBeenCalled();
  expect(screen.getByRole('button')).toBeEnabled();
});

test('logout without a session still redirects without clearing another player cache', async () => {
  (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
  render(<LogoutButton collapsed />);
  fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
  await waitFor(() => expect(push).toHaveBeenCalled());
  expect(clearOfflineDataForOwner).not.toHaveBeenCalled();
});

test.each(['returned', 'thrown'])('a %s logout error leaves the user on the page and enables retry', async (kind) => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  if (kind === 'returned') (signOut as jest.Mock).mockResolvedValue({ error: new Error('Failed') });
  else (signOut as jest.Mock).mockRejectedValue(new Error('Failed'));
  render(<LogoutButton collapsed={false} />);
  fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
  await waitFor(() => expect(log).toHaveBeenCalled());
  expect(push).not.toHaveBeenCalled();
  expect(clearOfflineDataForOwner).not.toHaveBeenCalled();
  expect(screen.getByRole('button')).toBeEnabled();
  log.mockRestore();
});
