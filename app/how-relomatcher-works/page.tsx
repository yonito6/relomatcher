// app/how-relomatcher-works/page.tsx
import Link from "next/link";

export const metadata = {
  title: "How ReloMatcher Works | Smart Country Finder Quiz",
  description:
    "Discover how ReloMatcher finds the best countries to live, relocate, or move to. Learn how our advanced relocation quiz compares taxes, climate, safety, cost of living and expat life.",
};

export default function HowRelomatcherWorksPage() {
  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">

        {/* Page Title */}
        <header className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            How ReloMatcher Works
          </h1>
          <p className="text-[15px] sm:text-[16px] text-slate-600 leading-relaxed">
            ReloMatcher is the smartest way to find the best country or city
            for your lifestyle, budget, safety preferences, climate needs,
            and long-term goals. Here’s exactly how our system analyzes your
            profile to recommend where you should live next.
          </p>
        </header>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            1. You Answer a Short Relocation Quiz
          </h2>
          <p className="text-[15px] leading-relaxed text-slate-700">
            The process starts with our{" "}
            <Link
              href="/"
              className="text-amber-600 font-semibold hover:underline"
            >
              Where Should I Move Quiz
            </Link>
            . It’s fast, friendly, and takes less than 2 minutes.
          </p>

          <p className="text-[15px] leading-relaxed text-slate-700">
            The quiz asks about the things that actually shape your quality
            of life — not just simple preferences. This includes:
          </p>

          <ul className="list-disc pl-6 text-[15px] text-slate-700 space-y-1">
            <li>Taxes and cost of living</li>
            <li>Climate and weather preferences</li>
            <li>Public transport and digital services</li>
            <li>Safety, stability, and corruption levels</li>
            <li>Healthcare expectations</li>
            <li>Expat scene & cultural fit</li>
            <li>Languages you speak</li>
          </ul>

          <p className="text-[15px] leading-relaxed text-slate-700">
            These inputs are crucial because they let us build a complete lifestyle
            fingerprint — a profile of what really matters to you.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            2. Our Ranking Engine Analyzes 100+ Global Factors
          </h2>
          <p className="text-[15px] leading-relaxed text-slate-700">
            Unlike generic “best countries to live in” lists, ReloMatcher uses
            a scoring system with real data. This includes:
          </p>

          <ul className="list-disc pl-6 text-[15px] text-slate-700 space-y-1">
            <li>Income potential & tax models</li>
            <li>Cost of living indexes</li>
            <li>Climate and livability scores</li>
            <li>Safety, crime, and political stability</li>
            <li>Digital services & infrastructure</li>
            <li>Public transport and walkability</li>
            <li>Expat communities and language compatibility</li>
            <li>LGBT friendliness (optional in matching)</li>
          </ul>

          <p className="text-[15px] leading-relaxed text-slate-700">
            Every country receives a personalized score based on the priorities
            you choose. This gives you accurate results — not generic suggestions.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            3. You Receive Your Best-Matched Countries & Cities
          </h2>
          <p className="text-[15px] leading-relaxed text-slate-700">
            Once the analysis is done, you’ll instantly see:
          </p>

          <ul className="list-disc pl-6 text-[15px] text-slate-700 space-y-1">
            <li>Your top 3 best-matched countries</li>
            <li>Countries that scored high but were disqualified</li>
            <li>AI explanations for each match</li>
          </ul>

          <p className="text-[15px] leading-relaxed text-slate-700">
            The results are personalized and explain *why* each country fits you —
            so you can feel confident in your next move.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            4. You Can Generate a Full Premium Relocation Report
          </h2>

          <p className="text-[15px] leading-relaxed text-slate-700">
            For those who want deeper insights, ReloMatcher lets you generate a
            complete relocation report instantly. It includes:
          </p>

          <ul className="list-disc pl-6 text-[15px] text-slate-700 space-y-1">
            <li>Visa options and residency pathways</li>
            <li>Expected tax savings based on your country</li>
            <li>Cost of living breakdowns</li>
            <li>Local lifestyle comparisons</li>
            <li>Pros & cons of each relocation match</li>
          </ul>

          <p className="text-[15px] leading-relaxed text-slate-700">
            This is ideal for expats, digital nomads, entrepreneurs, and anyone
            seriously planning a move.
          </p>
        </section>

        {/* SEO Section */}
        <section className="space-y-3 bg-white rounded-2xl p-5 shadow-md">
          <h2 className="text-xl font-semibold tracking-tight">
            Why ReloMatcher Is the Best Tool for Finding Where to Live
          </h2>
          <p className="text-[15px] leading-relaxed text-slate-700">
            Whether you’re searching for the{" "}
            <strong>best places to live in the world</strong>,{" "}
            <strong>best countries to live</strong>,{" "}
            <strong>best expat cities</strong>,{" "}
            <strong>easiest countries to immigrate to</strong>,
            or even a{" "}
            <strong>“Where Should I Move?” quiz</strong> — ReloMatcher is designed
            to give you more accurate, personalized results than any article or list.
          </p>
        </section>

        {/* CTA */}
        <section className="pt-6 pb-12 text-center">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-amber-400 rounded-2xl text-slate-900 
                       font-semibold shadow-md hover:bg-amber-300 transition-all text-lg"
          >
            Take the Where Should I Relocate Quiz →
          </Link>
        </section>
      </div>
    </div>
  );
}
