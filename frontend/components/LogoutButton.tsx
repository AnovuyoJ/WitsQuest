'use client';

import { signOut } from '@/lib/authService';
import { useRouter } from 'next/navigation';
import { useState } from 'react';


export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);


  const handleLogout = async () => {
    setLoading(true);

    try {
        const { error } = await signOut();
        if (error) {
            console.error('Logout error:', error);
            return;
        }
        router.push('/Login'); //redirect back to login page
        //router.refresh();
    } finally {
        setLoading(false);
    }
};

return (
    <button
        onClick={handleLogout}
        disabled={loading}
        //className=""
    >
        {loading ? 'Logging out...' : 'Log Out'}
    </button>
);
}