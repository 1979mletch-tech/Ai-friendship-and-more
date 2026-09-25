import Link from "next/link";

const starters = [
  "Just chat",
  "Cheer me up",
  "Something on my mind",
  "Have some fun",
  "Help me think",
  "Wind down",
];

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-sky-200/20 bg-gradient-to-br from-sky-500/20 to-violet-500/20 p-8 text-center">
        <p className="text-sm tracking-[0.2em] text-sky-200">AI FRIENDSHIP</p>
        <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">Someone to talk to. Anytime.</h1>
        <p className="mt-4 text-lg text-slate-100">Chat. Laugh. Think. Share. Explore.</p>
        <Link
          href="/chat"
          className="mt-6 inline-flex rounded-full bg-sky-300 px-6 py-3 font-medium text-slate-950 transition hover:bg-sky-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-200"
        >
          Talk to My Friend
        </Link>
      </section>

      <section aria-labelledby="topic-starters" className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 id="topic-starters" className="text-xl font-semibold text-white">
          What would you like to talk about?
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {starters.map((starter) => (
            <Link
              key={starter}
              href={`/chat?topic=${encodeURIComponent(starter)}`}
              className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-left text-slate-100 transition hover:border-sky-300/50 hover:bg-slate-800"
            >
              {starter}
            </Link>
          ))}
        </div>
      </section>

      <footer className="pb-4 text-center text-sm text-slate-300">
        AI companion • Not a human • Not a substitute for professional care
      </footer>
    </div>
  );
}
