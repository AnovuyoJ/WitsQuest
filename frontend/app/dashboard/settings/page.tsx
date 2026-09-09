import Link from "next/link";
import { ScreenHeader } from "@/components/WitsScreen";

export default function SettingsPage() {
  return <div className="mx-auto max-w-4xl p-6 sm:p-10">
    <ScreenHeader eyebrow="Your account" title="Settings" description="Help and guidance for your Wits Quest adventures." />
    <Link href="/dashboard/settings/rulebook" className="block rounded-2xl border border-slate-200 bg-white p-6 focus-visible:outline-2 focus-visible:outline-[#043673]">
      <h2 className="text-xl font-bold text-[#043673]">Game rulebook →</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Learn how to collect cards, exchange duplicates, build your five-card deck and battle a player or the CPU.</p>
    </Link>
  </div>;
}
