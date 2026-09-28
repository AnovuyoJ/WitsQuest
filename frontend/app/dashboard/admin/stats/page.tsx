"use client";

import { useAdminAccess } from "@/lib/useAdminAccess";
import { apiRequest } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";

type LocationStat = {
  id: string;
  title: string;
  total_verifications: number;
  unique_players: number;
};

type QuestionStat = {
  id: string;
  question_text: string;
  event_id: string;
  total_attempts: number;
  unique_players: number;
  correct_attempts: number;
  wrong_attempts: number;
  success_percentage: number;
};

type CardStat = {
  id: string;
  title: string;
  rarity: "Blue" | "Black" | "Gold";
  event_id: string;
  total_awards: number;
  unique_players: number;
  award_percentage: number;
};

type AnalyticsResponse = {
  locations: LocationStat[];
  questions: QuestionStat[];
  cards: CardStat[];
};

export default function AdminStatsPage() {
  const { checkingAccess, isAdmin: admin } = useAdminAccess();

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!admin) return;

    async function loadAnalytics() {
      setLoading(true);
      setError("");

      const { data, error } =
        await apiRequest<AnalyticsResponse>("/admin/analytics");

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setAnalytics(data);
      setLoading(false);
    }

    loadAnalytics();
  }, [admin]);

  if (!admin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
        {checkingAccess
          ? "Checking admin access..."
          : "Administrator access is required."}
      </div>
    );
  }

  const locations = analytics?.locations ?? [];
  const questions = analytics?.questions ?? [];
  const cards = analytics?.cards ?? [];

  const totalVisits = locations.reduce(
    (sum, location) => sum + location.total_verifications,
    0
  );

  const totalQuestionAttempts = questions.reduce(
    (sum, question) => sum + question.total_attempts,
    0
  );

  const totalCardAwards = cards.reduce(
    (sum, card) => sum + card.total_awards,
    0
  );

  return (
    <div className="space-y-8 px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.28em]"
            style={{ color: WITS_GOLD }}
          >
            Admin console
          </p>

          <h1
            className="mt-2 text-4xl font-black tracking-[-0.045em]"
            style={{ color: WITS_BLUE }}
          >
            Quest analytics
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Monitor player engagement with locations and questions, and track
            which cards are being awarded.
          </p>
        </div>

        <Link
          href="/dashboard/admin"
          className="rounded-xl border border-[#043673]/15 bg-white px-4 py-2 text-sm font-semibold text-[#043673] shadow-sm transition hover:bg-[#043673]/5"
        >
          ← Back to dashboard
        </Link>
      </header>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <section className="rounded-2xl border border-[#043673]/12 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">Loading analytics...</p>
        </section>
      ) : (
        <>
          {/* Overview */}
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#043673]/12 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Location visits
              </p>
              <p
                className="mt-2 text-3xl font-black"
                style={{ color: WITS_BLUE }}
              >
                {totalVisits}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Across all events
              </p>
            </div>

            <div className="rounded-2xl border border-[#043673]/12 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Question attempts
              </p>
              <p
                className="mt-2 text-3xl font-black"
                style={{ color: WITS_BLUE }}
              >
                {totalQuestionAttempts}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Across all challenges
              </p>
            </div>

            <div className="rounded-2xl border border-[#043673]/12 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Cards awarded
              </p>
              <p
                className="mt-2 text-3xl font-black"
                style={{ color: WITS_BLUE }}
              >
                {totalCardAwards}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Across all rewards
              </p>
            </div>
          </section>

          {/* Location engagement */}
          <section className="rounded-2xl border border-[#043673]/12 bg-white p-6">
            <div className="mb-5">
              <h2
                className="text-2xl font-black tracking-tight"
                style={{ color: WITS_BLUE }}
              >
                Location engagement
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                See which locations players are actually visiting.
              </p>
            </div>

            {locations.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                No location activity yet.
              </div>
            ) : (
              <div className="space-y-3">
                {locations.map((location) => (
                  <div
                    key={location.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {location.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {location.unique_players} unique player
                        {location.unique_players === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p
                        className="text-2xl font-black"
                        style={{ color: WITS_BLUE }}
                      >
                        {location.total_verifications}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        verifications
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Question engagement */}
          <section className="rounded-2xl border border-[#043673]/12 bg-white p-6">
            <div className="mb-5">
              <h2
                className="text-2xl font-black tracking-tight"
                style={{ color: WITS_BLUE }}
              >
                Question engagement
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                See which questions attract attempts and how players perform
                on them.
              </p>
            </div>

            {questions.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                No question attempts yet.
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800">
                          {question.question_text}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {question.unique_players} unique player
                          {question.unique_players === 1 ? "" : "s"} ·{" "}
                          {question.correct_attempts} correct ·{" "}
                          {question.wrong_attempts} wrong
                        </p>
                      </div>

                      <div className="shrink-0 text-left md:text-right">
                        <p
                          className="text-2xl font-black"
                          style={{ color: WITS_BLUE }}
                        >
                          {question.total_attempts}
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          attempts
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500">
                        Success rate
                      </span>

                      <span
                        className="font-black"
                        style={{ color: WITS_BLUE }}
                      >
                        {question.success_percentage}%
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(
                            question.success_percentage,
                            100
                          )}%`,
                          backgroundColor: WITS_BLUE,
                        }}
                      />
                    </div>

                    <Link
                      href={`/dashboard/admin/challenges?event=${question.event_id}`}
                      className="mt-3 inline-block text-xs font-semibold text-[#043673] underline"
                    >
                      Edit this question
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Card drop monitoring */}
          <section className="rounded-2xl border border-[#043673]/12 bg-white p-6">
            <div className="mb-5">
              <h2
                className="text-2xl font-black tracking-tight"
                style={{ color: WITS_BLUE }}
              >
                Card drop monitoring
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Monitor how often each reward card is being awarded. These are
                observed award rates, not configured probabilities.
              </p>
            </div>

            {cards.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                No cards have been awarded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800">
                          {card.title}
                        </p>

                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {card.rarity}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {card.unique_players} unique player
                        {card.unique_players === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="text-right">
                        <p
                          className="text-2xl font-black"
                          style={{ color: WITS_BLUE }}
                        >
                          {card.total_awards}
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          awards
                        </p>
                      </div>

                      <div className="w-20 text-right">
                        <p
                          className="text-lg font-black"
                          style={{ color: WITS_GOLD }}
                        >
                          {card.award_percentage}%
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          of drops
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}