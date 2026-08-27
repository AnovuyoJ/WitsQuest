"use client";

import { useState } from "react";
import { useChallenge } from "@/lib/useChallenge";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";

type ChallengeCardProps = {
  eventId: string;
};

export default function ChallengeCard({
  eventId,
}: ChallengeCardProps) {
  const { state, submit } = useChallenge(eventId);

  const [selectedOption, setSelectedOption] =
    useState<string | null>(null);

  const [textAnswer, setTextAnswer] =
    useState("");

  /*
   * Loading
   */
  if (state.status === "loading") {
    return (
      <p className="text-sm text-gray-500">
        Loading challenge…
      </p>
    );
  }

  /*
   * Error
   */
  if (state.status === "error") {
    return (
      <p className="text-sm text-red-600">
        {state.message}
      </p>
    );
  }

  /*
   * Result
   */
  if (state.status === "result") {
    const { result } = state;

    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-[0_2px_30px_-8px_rgba(4,54,115,0.2)]">
        {result.alreadyCompleted ? (
          <p className="text-sm text-gray-500">
            You've already completed this challenge.
          </p>
        ) : result.correct ? (
          <p className="font-serif text-lg text-green-700">
            Correct!
          </p>
        ) : (
          <p className="font-serif text-lg text-red-600">
            Not quite.
          </p>
        )}

        <p className="mt-2 text-sm text-gray-600">
          The answer was:{" "}
          <span className="font-semibold">
            {result.correctAnswer}
          </span>
        </p>

        {result.cardAwarded && (
          <div
            className="mt-4 rounded-xl px-4 py-3 text-sm font-semibold"
            style={{
              background: `${WITS_GOLD}20`,
              color: WITS_BLUE,
            }}
          >
            🎉 You earned a new card!
          </div>
        )}
      </div>
    );
  }

  /*
   * At this point state is either
   * "ready" or "submitting",
   * so challenge definitely exists.
   */
  const challenge = state.challenge;
  const submitting =
    state.status === "submitting";

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_2px_30px_-8px_rgba(4,54,115,0.2)]">
      <h3
        className="font-serif text-lg"
        style={{ color: WITS_BLUE }}
      >
        {challenge.question_text}
      </h3>

      {/* MULTIPLE CHOICE */}
      {challenge.question_type ===
        "multiple_choice" &&
        challenge.options && (
          <div className="mt-4 flex flex-col gap-2">
            {challenge.options.map(
              (option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setSelectedOption(option)
                  }
                  disabled={submitting}
                  className={`rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${
                    selectedOption === option
                      ? "border-transparent text-white"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                  style={
                    selectedOption === option
                      ? {
                          background:
                            WITS_BLUE,
                        }
                      : undefined
                  }
                >
                  {option}
                </button>
              )
            )}
          </div>
        )}

      {/* TRUE / FALSE */}
      {challenge.question_type ===
        "true_false" && (
        <div className="mt-4 flex gap-2">
          {["True", "False"].map(
            (option) => (
              <button
                key={option}
                type="button"
                onClick={() =>
                  setSelectedOption(option)
                }
                disabled={submitting}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                  selectedOption === option
                    ? "border-transparent text-white"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
                style={
                  selectedOption === option
                    ? {
                        background:
                          WITS_BLUE,
                      }
                    : undefined
                }
              >
                {option}
              </button>
            )
          )}
        </div>
      )}

      {/* TEXT ANSWER */}
      {challenge.question_type === "text" && (
        <input
          type="text"
          value={textAnswer}
          onChange={(event) =>
            setTextAnswer(
              event.target.value
            )
          }
          disabled={submitting}
          placeholder="Type your answer..."
          className="mt-4 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#043673]"
        />
      )}

      {/* SUBMIT */}
      <button
        type="button"
        onClick={() =>
          submit(
            challenge.question_type ===
              "text"
              ? textAnswer
              : selectedOption ?? ""
          )
        }
        disabled={
          submitting ||
          (challenge.question_type ===
          "text"
            ? textAnswer.trim() === ""
            : !selectedOption)
        }
        style={{
          background: WITS_BLUE,
        }}
        className="mt-5 w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
      >
        {submitting
          ? "Submitting…"
          : "Submit answer"}
      </button>
    </div>
  );
}