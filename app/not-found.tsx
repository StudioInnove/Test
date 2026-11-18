import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-svh items-center overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/film/stills/s1n-d.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-transparent" />
      <div className="relative px-6 sm:px-10 md:px-[6vw]">
        <p className="index mb-5">404</p>
        <h1 className="t-display max-w-[12ch]">This page wandered off.</h1>
        <Link href="/" className="btn btn-primary mt-10">Back to the studio</Link>
      </div>
    </main>
  );
}
