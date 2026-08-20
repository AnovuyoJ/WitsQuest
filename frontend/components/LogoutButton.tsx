'use client';

import { signOut } from '@/lib/authService';
import { useRouter } from 'next/navigation';
import { useState } from 'react';


export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleLogout = async () => {
    setLoading(true);
    setError(null);

    try {
        const { error } = await signOut();
        if (error) {
            console.error('Logout error:', error);
            setError('Failed to log out. Please try again.');
            return;
        }
        router.push('/Login'); //redirect back to login page
        router.refresh();
    } catch (err) {
        console.error('Unexpected logout error:', err);
        setError('Something went wrong. Please try again.');
    } finally {
        setLoading(false);
    }
};

return (
    <div>
        <button
            onClick={handleLogout}
            disabled={loading}
            //className=""
        >
            {loading ? 'Logging out...' : 'Log Out'}
        </button>
        {error && <p role="alert">{error}</p>}
    </div>
);
}