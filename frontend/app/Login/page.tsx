import Link from "next/link";
import SignInForm from "@/components/SignInForm";

export default function LoginPage() {
  return (
    <main
      className="min-h-[100dvh] text-[#10233D]"
      style={{
        backgroundImage: "linear-gradient(rgba(17, 12, 8, 0.52), rgba(17, 12, 8, 0.68)), url('/art/campus-map.png')",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3 font-black tracking-tight text-[#f3d9a5] skeuo-text-emboss">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#8d4f2d] to-[#3f2414] text-xs font-black text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_2px_5px_rgba(0,0,0,0.25)] border border-[#2a170d]">
            WQ
          </span>
          WitsQuest
        </Link>
        <Link href="/signup" className="skeuo-btn-secondary px-5 py-2.5 text-sm font-bold" style={{ color: "#6f3d20" }}>
          Create account
        </Link>
      </nav>

      <section className="mx-auto flex max-w-6xl items-center justify-center px-5 pb-10 pt-3 sm:px-8 lg:px-12">
        <div className="flex w-full items-center justify-center py-4 sm:py-6">
          <SignInForm />
        </div>
      </section>
    </main>
  );
}
