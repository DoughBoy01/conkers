import React from "react";
import { Play } from "lucide-react";
import { STORY_CHAPTERS } from "../data/storyboard.ts";

interface RulesStripProps {
  activeChapterId: string;
  onJumpToChapter: (startTime: number) => void;
}

const RANK_LADDER = [
  { wins: "0", name: "Fresh Conker", note: "Newly threaded and yet to win" },
  { wins: "1", name: "One-er", note: "Winner of its first playground duel" },
  { wins: "2", name: "Two-er", note: "Defeated a second challenger" },
  { wins: "3", name: "Three-er", note: "Seasoned survivor with three wins" },
  { wins: "5+", name: "Five-er & Beyond", note: "Inherits defeated opponent tallies in championship rules" },
];

export const RulesStrip: React.FC<RulesStripProps> = ({
  activeChapterId,
  onJumpToChapter,
}) => {
  return (
    <div className="mt-14 space-y-14">
      {/* Section 1: Clickable 5-Step Rules Breakdown */}
      <section id="rules" className="border-t border-ink/12 pt-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-chestnut">
              Playground Rules · Click any step to jump in the film
            </p>
            <h2 className="mt-1.5 font-display text-2xl md:text-3xl font-semibold text-ink">
              Five Steps from Chestnut Tree to Champion
            </h2>
          </div>
          <p className="max-w-md text-sm text-bark">
            Played every autumn across Britain since the nineteenth century,
            conkers needs only two horse chestnuts, string, and steady nerves.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-6">
          {STORY_CHAPTERS.map((chapter) => {
            const isCurrent = activeChapterId === chapter.id;
            return (
              <button
                key={chapter.id}
                type="button"
                onClick={() => onJumpToChapter(chapter.start)}
                className={`group text-left rounded-xl border p-4 transition-colors cursor-pointer ${
                  isCurrent
                    ? "border-chestnut/45 bg-parchment"
                    : "border-ink/12 bg-vellum hover:bg-parchment/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-chestnut tabular-nums">
                    {chapter.index}
                  </span>
                  <Play className="h-3.5 w-3.5 text-bark opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <h3 className="mt-2.5 font-display text-base font-semibold text-ink">
                  {chapter.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-bark">
                  {chapter.summary}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Section 2: Conker Rank Tally Reference */}
      <section id="ranks" className="border-t border-ink/12 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5">
            <p className="text-xs font-medium tracking-wide text-oakmoss">
              Traditional Scoring
            </p>
            <h2 className="mt-1.5 font-display text-2xl md:text-3xl font-semibold text-ink">
              How a Conker Earns Its Title
            </h2>
            <p className="mt-3 text-sm md:text-base leading-relaxed text-bark">
              Unlike points in other games, a conker&apos;s score stays tied to
              that single seed. Each victory raises its rank—turning a lucky
              autumn chestnut into a prized schoolyard legend.
            </p>
          </div>

          <div className="lg:col-span-7 overflow-hidden rounded-xl border border-ink/12 bg-vellum">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-ink/10 bg-parchment/70 text-xs font-medium text-bark">
                  <th className="px-4 py-3">Wins</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8 text-sm">
                {RANK_LADDER.map((row) => (
                  <tr key={row.name}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-chestnut tabular-nums">
                      {row.wins}
                    </td>
                    <td className="px-4 py-3 font-display font-semibold text-ink whitespace-nowrap">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-bark">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
