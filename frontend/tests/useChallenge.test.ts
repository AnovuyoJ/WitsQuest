import { act, renderHook, waitFor } from '@testing-library/react';
import { useChallenge } from '../lib/useChallenge';
import { apiRequest } from '../lib/api';
import { supabase } from '../lib/supabaseClient';
import { cacheChallenge, getCachedChallenge, queueOfflineAttempt } from '../lib/offlineDb';

jest.mock('../lib/api', () => ({ apiRequest: jest.fn() }));
jest.mock('../lib/supabaseClient', () => ({ supabase: { auth: { getSession: jest.fn() } } }));
jest.mock('../lib/offlineDb', () => ({ cacheChallenge: jest.fn(), getCachedChallenge: jest.fn(), queueOfflineAttempt: jest.fn() }));
const challenge = { id: 'question', event_id: 'event', question_text: 'Where?', question_type: 'text', options: null, card_id: null, offline_token: 'lease', offline_expires_at: '2099-01-01T00:00:00Z' };
const online = (value: boolean) => Object.defineProperty(navigator, 'onLine', { configurable: true, value });
beforeEach(() => {
  jest.resetAllMocks(); online(true);
  (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: { user: { id: 'player' } } }, error: null });
  (apiRequest as jest.Mock).mockResolvedValue({ data: challenge, error: null });
});
afterEach(() => online(true));

test('loads and caches a challenge, then submits and displays the result', async () => {
  const { result } = renderHook(() => useChallenge('event'));
  await waitFor(() => expect(result.current.state.status).toBe('ready'));
  expect(cacheChallenge).toHaveBeenCalledWith('player', challenge);
  await act(async () => { await result.current.submit('   '); });
  expect(apiRequest).toHaveBeenCalledTimes(1);
  const outcome = { correct: true, correctAnswer: 'Hall', alreadyCompleted: false, cardAwarded: true };
  (apiRequest as jest.Mock).mockResolvedValue({ data: outcome, error: null });
  await act(async () => { await result.current.submit('Hall'); });
  expect(apiRequest).toHaveBeenLastCalledWith('/events/event/submit-answer', 'POST', { challengeId: 'question', answer: 'Hall' });
  expect(result.current.state).toEqual({ status: 'result', challenge, result: outcome });
});

test.each([
  [undefined, "This challenge isn't available offline yet"],
  [{ ...challenge, offline_expires_at: '2000-01-01' }, 'This offline challenge window has expired'],
])('rejects unavailable or expired offline challenges', async (cached, message) => {
  online(false); (getCachedChallenge as jest.Mock).mockResolvedValue(cached);
  const { result } = renderHook(() => useChallenge('event'));
  await waitFor(() => expect(result.current.state).toEqual({ status: 'error', message: expect.stringContaining(message) }));
  expect(apiRequest).not.toHaveBeenCalled();
});

test('queues an offline answer for the signed-in player', async () => {
  online(false); (getCachedChallenge as jest.Mock).mockResolvedValue(challenge);
  const { result } = renderHook(() => useChallenge('event'));
  await waitFor(() => expect(result.current.state.status).toBe('ready'));
  await act(async () => { await result.current.submit('Hall'); });
  expect(queueOfflineAttempt).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'player', eventId: 'event', challengeId: 'question', answer: 'Hall', offlineToken: 'lease' }));
  expect(result.current.state.status).toBe('queued');
});

test.each([{ message: 'Network down' }, { message: 'Auth unavailable', code: 'AUTH_UNAVAILABLE', status: 503 }])('preserves answers when connectivity fails during submission', async (error) => {
  const { result } = renderHook(() => useChallenge('event'));
  await waitFor(() => expect(result.current.state.status).toBe('ready'));
  (apiRequest as jest.Mock).mockResolvedValue({ error });
  await act(async () => { await result.current.submit('Hall'); });
  expect(result.current.state.status).toBe('queued');
  expect(queueOfflineAttempt).toHaveBeenCalled();
});

test.each([{ error: { message: 'Not allowed', status: 403 } }, { data: null, error: null }])('shows submission errors without queuing invalid answers', async (response) => {
  const { result } = renderHook(() => useChallenge('event'));
  await waitFor(() => expect(result.current.state.status).toBe('ready'));
  (apiRequest as jest.Mock).mockResolvedValue(response);
  await act(async () => { await result.current.submit('Hall'); });
  expect(result.current.state.status).toBe('error');
  expect(queueOfflineAttempt).not.toHaveBeenCalled();
});

test('falls back to a valid cached challenge after an API error', async () => {
  (apiRequest as jest.Mock).mockResolvedValue({ error: { message: 'Unavailable' } });
  (getCachedChallenge as jest.Mock).mockResolvedValue(challenge);
  const { result } = renderHook(() => useChallenge('event'));
  await waitFor(() => expect(result.current.state).toEqual({ status: 'ready', challenge }));
});

test.each(['empty-event', 'signed-out', 'no-question', 'api-error'])('handles %s while loading', async (scenario) => {
  if (scenario === 'signed-out') (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null }, error: null });
  if (scenario === 'no-question') (apiRequest as jest.Mock).mockResolvedValue({ data: null, error: null });
  if (scenario === 'api-error') (apiRequest as jest.Mock).mockResolvedValue({ error: { message: 'Unavailable' } });
  const { result } = renderHook(() => useChallenge(scenario === 'empty-event' ? '' : 'event'));
  await waitFor(() => expect(result.current.state.status).toBe('error'));
});

test('requires a session again when submitting', async () => {
  const { result } = renderHook(() => useChallenge('event'));
  await waitFor(() => expect(result.current.state.status).toBe('ready'));
  (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null }, error: null });
  await act(async () => { await result.current.submit('Hall'); });
  expect(result.current.state).toEqual({ status: 'error', message: 'Sign in again before saving this answer.' });
});

test('rejects an offline answer when its lease expires after loading', async () => {
  const { result } = renderHook(() => useChallenge('event'));
  await waitFor(() => expect(result.current.state.status).toBe('ready'));
  online(false);
  const now = jest.spyOn(Date, 'now').mockReturnValue(new Date('2100-01-01').getTime());
  await act(async () => { await result.current.submit('Hall'); });
  expect(result.current.state.status).toBe('error');
  expect(queueOfflineAttempt).not.toHaveBeenCalled(); now.mockRestore();
});
