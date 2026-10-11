import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen campus-background px-5 py-12">
      <article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 text-slate-800 shadow-sm sm:p-10">
        <Link href="/" className="font-semibold text-blue-800 underline">Back to WitsQuest</Link>
        <h1 className="mt-6 text-3xl font-bold">Privacy Policy and POPIA Notice</h1>
        <p className="mt-4 leading-7">This notice explains how WitsQuest uses personal information and your rights under South Africa’s Protection of Personal Information Act (POPIA).</p>
        <p className="mt-4 rounded-lg bg-amber-50 p-4 leading-7">This notice is being finalised. The responsible party, dedicated privacy contact, data retention periods, and hosting locations still need confirmation with the project client.</p>

        <h2 className="mt-8 text-xl font-bold">Information we use and why</h2>
        <p className="mt-3 leading-7">We use account and profile information to identify you and manage sign-in. We store quest answers, progress, collected cards, and match activity to run the game. Location verification records may include coordinates and are used to check that you reached a campus challenge. Gameplay and verification activity support fair-play checks and moderator review.</p>
        <p className="mt-3 leading-7">An account is needed for gameplay. Location access is optional, but challenges requiring location verification cannot be completed without it. Camera access is requested for features that need it. You can change location and camera permissions in your browser settings.</p>

        <h2 className="mt-8 text-xl font-bold">Storage and service providers</h2>
        <p className="mt-3 leading-7">WitsQuest uses Supabase for authentication and database hosting, Render for its API, and Vercel for its frontend. These services process information needed to provide the app. Passwords are handled by the authentication service. The team must confirm the configured hosting regions and arrangements for any processing outside South Africa.</p>
        <p className="mt-3 leading-7">Cached events, challenges, and pending offline answers are stored on your device for offline play. Use the app’s Logout button on shared devices to clear your account’s offline challenges and answers.</p>

        <h2 className="mt-8 text-xl font-bold">Retention and account deletion</h2>
        <p className="mt-3 leading-7">Account and gameplay data are stored so you can continue playing. The team has not yet confirmed retention periods for account data, location records, logs, or backups. Deleting an account should not be taken as a promise that every backup is erased immediately.</p>
        <p className="mt-3 leading-7">You can use <Link href="/account/delete" className="text-blue-800 underline">Delete account</Link> while signed in. Read the confirmation screen for the information removed and the effect on your game progress.</p>

        <h2 className="mt-8 text-xl font-bold">Your POPIA rights</h2>
        <p className="mt-3 leading-7">Subject to the Act’s requirements, you can request access to your personal information, ask for inaccurate information to be corrected, and request deletion. You can object to processing in applicable circumstances and withdraw consent where processing relies on consent. Withdrawing consent does not undo processing that was lawful before withdrawal.</p>
        <p className="mt-3 leading-7">A dedicated contact for privacy requests is awaiting confirmation. Until then, raise privacy questions with the project team during a client or user-feedback session. Do not post personal information in the public issue tracker.</p>
        <p className="mt-3 leading-7">You may also lodge a complaint with South Africa’s <a href="https://inforegulator.org.za/" className="text-blue-800 underline" target="_blank" rel="noopener noreferrer">Information Regulator</a>. The <a href="https://www.justice.gov.za/legislation/acts/2013-004.pdf" className="text-blue-800 underline" target="_blank" rel="noopener noreferrer">POPIA legislation</a> sets out these rights and the conditions for lawful processing.</p>
      </article>
    </main>
  );
}
