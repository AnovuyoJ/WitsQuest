export default function ForwardArrowIcon({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-[1em] w-[1em] shrink-0 bg-current ${className}`}
      style={{
        WebkitMask: "url(/icons/arrow-forward.svg) center / contain no-repeat",
        mask: "url(/icons/arrow-forward.svg) center / contain no-repeat",
      }}
    />
  );
}
