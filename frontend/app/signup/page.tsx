import SignUpForm from "@/components/SignUpForm";

export default function SignUpPage() {
  return (
    <main className="grid min-h-[100dvh] bg-[#C9A24B] lg:grid-cols-[.8fr_1.2fr]">
      <aside className="hidden p-12 text-[#082C58] lg:flex lg:flex-col lg:justify-between"><span className="text-sm font-black">WQ / WITS</span><div><p className="text-[10px] font-bold uppercase tracking-[.28em]">Join the quest</p><h2 className="mt-4 text-5xl font-black leading-[.95] tracking-[-.055em]">Build a collection from the campus around you.</h2></div><p className="text-sm text-[#082C58]/60">Made for Wits students</p></aside>
      <section className="flex items-center justify-center bg-[#F4F6F9] px-5 py-8 sm:p-10"><SignUpForm /></section>
    </main>
  );
}
