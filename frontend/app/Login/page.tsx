import SignInForm from "@/components/SignInForm";

export default function LoginPage() {
  return (
    <main className="grid min-h-[100dvh] bg-[#043673] lg:grid-cols-[.8fr_1.2fr]">
      <aside className="hidden p-12 text-white lg:flex lg:flex-col lg:justify-between"><span className="text-sm font-black text-[#E2C66F]">WQ / WITS</span><div><p className="text-[10px] font-bold uppercase tracking-[.28em] text-[#E2C66F]">Return to the field</p><h2 className="mt-4 text-5xl font-black leading-[.95] tracking-[-.055em]">Your next campus story is waiting.</h2></div><p className="text-sm text-white/55">Braamfontein, Johannesburg</p></aside>
      <section className="flex items-center justify-center bg-[#F4F6F9] px-5 py-8 sm:p-10"><SignInForm /></section>
    </main>
  );
}
