import AuthSidePanel from "@/components/AuthSidePanel";
import MobileAuthVideo from "@/components/MobileAuthVideo";
import SignInForm from "@/components/SignInForm";

export default function LoginPage() {
  return (
    <main className="grid min-h-[100dvh] campus-background lg:grid-cols-[.8fr_1.2fr]">
      <AuthSidePanel><span className="text-sm font-black">WQ / WITS</span><div><p className="text-[10px] font-bold uppercase tracking-[.28em] text-white/80">Return to the field</p><h2 className="mt-4 text-5xl font-black leading-[.95] tracking-[-.055em]">Your next campus story is waiting.</h2></div><p className="text-sm">Braamfontein, Johannesburg</p></AuthSidePanel>
      <section className="mobile-auth-section flex flex-col items-center justify-center campus-background px-5 py-8 sm:p-10"><MobileAuthVideo /><SignInForm /></section>
    </main>
  );
}
