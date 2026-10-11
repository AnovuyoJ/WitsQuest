import Link from "next/link";

export default function RulebookButton({ section, label = "Rulebook" }: { section?: string; label?: string }) {
  return (
    <Link href={`/dashboard/settings/rulebook${section ? `#${section}` : ""}`} className="skeuo-btn-secondary px-4 py-2 text-sm font-bold gap-2">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </svg>
      {label}
    </Link>
  );
}
