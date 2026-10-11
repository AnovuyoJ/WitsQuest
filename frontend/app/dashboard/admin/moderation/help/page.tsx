import Link from "next/link";
import AdminPageHeader from "@/components/AdminPageHeader";

export default function ModerationHelpPage() {
  return (
    <div className="space-y-6 p-6">
      <AdminPageHeader
        title="Trust & Moderation Guide"
        description="How player signals, restrictions, and moderator decisions work."
        action={
          <Link
            href="/dashboard/admin/moderation"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/30 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E2C66F]"
          >
            Back to desk
          </Link>
        }
      />

      <section aria-labelledby="trust-signals-heading" className="max-w-4xl border-b border-slate-300 pb-6">
        <h2 id="trust-signals-heading" className="text-xl font-bold text-[#082C58]">What affects a trust score</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
          The system scores suspicious movement, repeated challenge submissions (after three retries), frequent forfeits
          (three within 30 days), and repeated pairings (at least five matches, with 80% or more against the same opponent).
        </p>
      </section>

      <section aria-labelledby="enforcement-heading" className="max-w-4xl border-b border-slate-300 pb-6">
        <h2 id="enforcement-heading" className="text-xl font-bold text-[#082C58]">Restrictions and review</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
          Moderate-risk players receive a 5-minute gameplay cooldown; severe scores receive a 60-minute restriction
          and an admin-review flag. Temporary restrictions expire, while moderators can clear, warn, throttle, restrict,
          or ban players.
        </p>
      </section>

      <p className="max-w-3xl text-sm leading-6 text-slate-600">
        A flag is a request for moderator review, not an automatic finding of misconduct. Review the recorded signals
        and context before choosing an action.
      </p>
    </div>
  );
}