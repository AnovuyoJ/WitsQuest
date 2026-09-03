'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function DeleteAccountButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setError('You must be logged in to delete your account.');
        return;
      }

      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Failed to delete account.');
        return;
      }

      // Sign out locally too, since the account no longer exists
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Delete account error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)}>
        Delete Account
      </button>
    );
  }

  return (
    <div>
      <p role="alert">
        This will permanently delete your account and all associated data. This cannot be undone.
      </p>
      <p>Type <strong>DELETE</strong> to confirm:</p>
      <input
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        disabled={loading}
      />
      {error && <p role="alert">{error}</p>}
      <button onClick={handleDelete} disabled={loading}>
        {loading ? 'Deleting...' : 'Confirm Delete'}
      </button>
      <button onClick={() => setConfirming(false)} disabled={loading}>
        Cancel
      </button>
    </div>
  );
}