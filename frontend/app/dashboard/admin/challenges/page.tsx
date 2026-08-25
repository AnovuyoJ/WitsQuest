"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";
const ADMIN_GITHUB_USERNAME = "AnovuyoJ";

type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "text";

type Event = {
  id: string;
  title: string;
};

type Challenge = {
  id: string;
  event_id: string;
  question_text: string;
  question_type: QuestionType;
  options: string[] | null;
  correct_answer: string;
  card_id: string | null;
  created_at: string | null;
};

function getGitHubUsernameCandidates(user: any): string[] {
  if (!user) return [];

  const values = [
    user?.user_metadata?.user_name,
    user?.user_metadata?.login,
    user?.user_metadata?.preferred_username,
    user?.user_metadata?.name,
    user?.email?.split("@")[0],

    user?.identities?.map(
      (identity: any) =>
        identity?.identity_data?.user_name
    ),

    user?.identities?.map(
      (identity: any) =>
        identity?.identity_data?.login
    ),

    user?.identities?.map(
      (identity: any) =>
        identity?.identity_data?.preferred_username
    ),
  ];

  return values
    .flat()
    .filter(
      (value): value is string =>
        typeof value === "string"
    )
    .map((value) => value.trim())
    .filter(Boolean);
}

function isAdminGitHubUser(user: any) {
  if (!user) return false;

  const candidates =
    getGitHubUsernameCandidates(user).map((value) =>
      value.toLowerCase()
    );

  return candidates.includes(
    ADMIN_GITHUB_USERNAME.toLowerCase()
  );
}

export default function AdminChallengesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const eventFromUrl = searchParams.get("event");

  const [checkingAccess, setCheckingAccess] =
    useState(true);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [events, setEvents] =
    useState<Event[]>([]);

  const [challenges, setChallenges] =
    useState<Challenge[]>([]);

  const [selectedEvent, setSelectedEvent] =
    useState("");

  const [questionType, setQuestionType] =
    useState<QuestionType>("multiple_choice");

  const [question, setQuestion] =
    useState("");

  const [options, setOptions] =
    useState("");

  const [answer, setAnswer] =
    useState("");

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  /*
   * ----------------------------------------------------
   * ADMIN ACCESS
   * ----------------------------------------------------
   */

  useEffect(() => {
    let mounted = true;

    async function checkAdmin() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) {
        if (!mounted) return;

        setCheckingAccess(false);
        setIsAdmin(false);

        router.replace("/dashboard");
        return;
      }

      const adminAccess =
        isAdminGitHubUser(user);

      if (!mounted) return;

      setIsAdmin(adminAccess);
      setCheckingAccess(false);

      if (!adminAccess) {
        router.replace("/dashboard");
      }
    }

    checkAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user;

        if (!user) {
          setIsAdmin(false);
          setCheckingAccess(false);

          router.replace("/dashboard");
          return;
        }

        const adminAccess =
          isAdminGitHubUser(user);

        setIsAdmin(adminAccess);
        setCheckingAccess(false);

        if (!adminAccess) {
          router.replace("/dashboard");
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  /*
   * ----------------------------------------------------
   * LOAD EVENTS
   * ----------------------------------------------------
   */

  useEffect(() => {
    if (!isAdmin) return;

    async function loadEvents() {
      const { data, error } = await supabase
        .from("events")
        .select("id,title")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        setError(error.message);
        return;
      }

      const loadedEvents =
        (data ?? []) as Event[];

      setEvents(loadedEvents);

      /*
       * If we came here from:
       *
       * /dashboard/admin/challenges?event=...
       *
       * automatically select that event.
       */
      if (
        eventFromUrl &&
        loadedEvents.some(
          (event) =>
            event.id === eventFromUrl
        )
      ) {
        setSelectedEvent(eventFromUrl);
      } else if (loadedEvents.length > 0) {
        setSelectedEvent(
          (current) =>
            current || loadedEvents[0].id
        );
      }
    }

    loadEvents();
  }, [isAdmin, eventFromUrl]);

  /*
   * ----------------------------------------------------
   * LOAD CHALLENGES FOR SELECTED EVENT
   * ----------------------------------------------------
   */

  useEffect(() => {
    if (!selectedEvent) {
      setChallenges([]);
      return;
    }

    async function loadChallenges() {
      setError("");

      const { data, error } = await supabase
        .from("challenges")
        .select(
          `
          id,
          event_id,
          question_text,
          question_type,
          options,
          correct_answer,
          card_id,
          created_at
          `
        )
        .eq("event_id", selectedEvent)
        .order("created_at", {
          ascending: true,
        });

      if (error) {
        setError(error.message);
        return;
      }

      setChallenges(
        (data ?? []) as Challenge[]
      );
    }

    loadChallenges();
  }, [selectedEvent]);

  /*
   * ----------------------------------------------------
   * RESET FORM
   * ----------------------------------------------------
   */

  function resetForm() {
    setQuestion("");
    setQuestionType("multiple_choice");
    setOptions("");
    setAnswer("");
    setEditingId(null);
  }

  /*
   * ----------------------------------------------------
   * CREATE / UPDATE CHALLENGE
   * ----------------------------------------------------
   */

  async function handleSubmit(
    e: FormEvent
  ) {
    e.preventDefault();

    setMessage("");
    setError("");

    const cleanQuestion =
      question.trim();

    const cleanAnswer =
      answer.trim();

    if (!selectedEvent) {
      setError(
        "Please select an event."
      );
      return;
    }

    if (!cleanQuestion) {
      setError(
        "Please enter a question."
      );
      return;
    }

    if (!cleanAnswer) {
      setError(
        "Please enter the correct answer."
      );
      return;
    }

    let challengeOptions:
      | string[]
      | null = null;

    /*
     * Multiple choice
     */
    if (
      questionType ===
      "multiple_choice"
    ) {
      const cleanOptions = options
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (cleanOptions.length < 2) {
        setError(
          "Please enter at least two options."
        );
        return;
      }

      if (
        !cleanOptions.includes(
          cleanAnswer
        )
      ) {
        setError(
          "The correct answer must exactly match one of the options."
        );
        return;
      }

      challengeOptions =
        cleanOptions;
    }

    /*
     * True / false
     */
    if (
      questionType ===
      "true_false"
    ) {
      if (
        cleanAnswer !== "True" &&
        cleanAnswer !== "False"
      ) {
        setError(
          "For a True / False question, select True or False as the correct answer."
        );
        return;
      }

      challengeOptions = null;
    }

    /*
     * Text question
     */
    if (questionType === "text") {
      challengeOptions = null;
    }

    const challengeData = {
      event_id: selectedEvent,
      question_text: cleanQuestion,
      question_type: questionType,
      options: challengeOptions,
      correct_answer: cleanAnswer,
    };

    setSaving(true);

    /*
     * Update existing
     */
    if (editingId) {
      const { data, error } =
        await supabase
          .from("challenges")
          .update(challengeData)
          .eq("id", editingId)
          .select()
          .single();

      setSaving(false);

      if (error) {
        setError(error.message);
        return;
      }

      setChallenges((current) =>
        current.map((challenge) =>
          challenge.id === editingId
            ? (data as Challenge)
            : challenge
        )
      );

      setMessage(
        "Challenge updated successfully."
      );

      resetForm();
      return;
    }

    /*
     * Create new
     */
    const { data, error } =
      await supabase
        .from("challenges")
        .insert(challengeData)
        .select()
        .single();

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setChallenges((current) => [
      ...current,
      data as Challenge,
    ]);

    setMessage(
      "Challenge added successfully."
    );

    resetForm();
  }

  /*
   * ----------------------------------------------------
   * EDIT CHALLENGE
   * ----------------------------------------------------
   */

  function editChallenge(
    challenge: Challenge
  ) {
    setEditingId(challenge.id);

    setQuestion(
      challenge.question_text
    );

    setQuestionType(
      challenge.question_type
    );

    setOptions(
      challenge.options?.join(", ") ??
        ""
    );

    setAnswer(
      challenge.correct_answer
    );

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /*
   * ----------------------------------------------------
   * DELETE CHALLENGE
   * ----------------------------------------------------
   */

  async function deleteChallenge(
    id: string
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this challenge?"
      );

    if (!confirmed) return;

    setError("");
    setMessage("");

    const { error } = await supabase
      .from("challenges")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setChallenges((current) =>
      current.filter(
        (challenge) =>
          challenge.id !== id
      )
    );

    if (editingId === id) {
      resetForm();
    }

    setMessage(
      "Challenge deleted successfully."
    );
  }

  /*
   * ----------------------------------------------------
   * EVENT TITLE
   * ----------------------------------------------------
   */

  const selectedEventTitle =
    events.find(
      (event) =>
        event.id === selectedEvent
    )?.title ?? "";

  /*
   * ----------------------------------------------------
   * ACCESS STATES
   * ----------------------------------------------------
   */

  if (checkingAccess) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
        Checking admin access...
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  /*
   * ----------------------------------------------------
   * PAGE
   * ----------------------------------------------------
   */

  return (
    <div className="space-y-8 p-4 md:p-6">

      {/* HEADER */}

      <header>
        <p
          className="text-xs font-semibold uppercase tracking-[0.28em]"
          style={{
            color: WITS_GOLD,
          }}
        >
          Admin console
        </p>

        <h1
          className="mt-2 font-serif text-3xl"
          style={{
            color: WITS_BLUE,
          }}
        >
          Challenges
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Add and manage questions for each event.
        </p>
      </header>

      {/* MESSAGES */}

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* EVENT SELECTOR */}

      <section className="rounded-[28px] border border-[#043673]/10 bg-white p-6 shadow-[0_2px_24px_-10px_rgba(4,54,115,0.2)]">

        <p
          className="text-xs font-semibold uppercase tracking-[0.2em]"
          style={{
            color: WITS_GOLD,
          }}
        >
          Event
        </p>

        <h2
          className="mt-2 font-serif text-xl"
          style={{
            color: WITS_BLUE,
          }}
        >
          Choose an event
        </h2>

        {events.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
            No events exist yet. Create an event first.
          </div>
        ) : (
          <select
            value={selectedEvent}
            onChange={(e) => {
              setSelectedEvent(
                e.target.value
              );

              resetForm();
              setMessage("");
              setError("");
            }}
            className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#043673]"
          >
            {events.map((event) => (
              <option
                key={event.id}
                value={event.id}
              >
                {event.title}
              </option>
            ))}
          </select>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">

        {/* CREATE / EDIT */}

        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-[#043673]/10 bg-white p-6 shadow-[0_2px_24px_-10px_rgba(4,54,115,0.2)]"
        >
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{
              color: WITS_GOLD,
            }}
          >
            {editingId
              ? "Edit question"
              : "New question"}
          </p>

          <h2
            className="mt-2 font-serif text-2xl"
            style={{
              color: WITS_BLUE,
            }}
          >
            {editingId
              ? "Update challenge"
              : "Add challenge"}
          </h2>

          {selectedEventTitle && (
            <p className="mt-2 text-sm text-slate-500">
              Adding question to{" "}
              <span className="font-semibold text-[#043673]">
                {selectedEventTitle}
              </span>
            </p>
          )}

          <div className="mt-6 space-y-5">

            {/* QUESTION TYPE */}

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Question type
              </span>

              <select
                value={questionType}
                onChange={(e) => {
                  const value =
                    e.target
                      .value as QuestionType;

                  setQuestionType(
                    value
                  );

                  setOptions("");

                  if (
                    value ===
                    "true_false"
                  ) {
                    setAnswer(
                      "True"
                    );
                  } else {
                    setAnswer("");
                  }
                }}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#043673]"
              >
                <option value="multiple_choice">
                  Multiple choice
                </option>

                <option value="true_false">
                  True / False
                </option>

                <option value="text">
                  Text answer
                </option>
              </select>
            </label>

            {/* QUESTION */}

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Question
              </span>

              <textarea
                value={question}
                onChange={(e) =>
                  setQuestion(
                    e.target.value
                  )
                }
                className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#043673]"
                placeholder="Who designed the Great Hall?"
              />
            </label>

            {/* MULTIPLE CHOICE */}

            {questionType ===
              "multiple_choice" && (
              <>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Options
                  </span>

                  <input
                    value={options}
                    onChange={(e) =>
                      setOptions(
                        e.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#043673]"
                    placeholder="Option A, Option B, Option C, Option D"
                  />

                  <span className="mt-1 block text-xs text-slate-400">
                    Separate each option with a comma.
                  </span>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Correct answer
                  </span>

                  <input
                    value={answer}
                    onChange={(e) =>
                      setAnswer(
                        e.target.value
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#043673]"
                    placeholder="Option A"
                  />

                  <span className="mt-1 block text-xs text-slate-400">
                    Must exactly match one of the options above.
                  </span>
                </label>
              </>
            )}

            {/* TRUE / FALSE */}

            {questionType ===
              "true_false" && (
              <div>
                <span className="text-sm font-semibold text-slate-700">
                  Correct answer
                </span>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  {[
                    "True",
                    "False",
                  ].map(
                    (option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setAnswer(
                            option
                          )
                        }
                        className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                          answer ===
                          option
                            ? "border-[#043673] bg-[#043673] text-white"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                      >
                        {option}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* TEXT */}

            {questionType ===
              "text" && (
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Correct answer
                </span>

                <input
                  value={answer}
                  onChange={(e) =>
                    setAnswer(
                      e.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#043673]"
                  placeholder="Enter the expected answer"
                />
              </label>
            )}

            {/* BUTTONS */}

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={
                  saving ||
                  !selectedEvent
                }
                className="rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background:
                    WITS_BLUE,
                }}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update challenge"
                    : "Add challenge"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>

        {/* EXISTING CHALLENGES */}

        <section className="rounded-[28px] border border-[#043673]/10 bg-white p-6 shadow-[0_2px_24px_-10px_rgba(4,54,115,0.2)]">

          <div className="flex items-center justify-between gap-4">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{
                  color:
                    WITS_GOLD,
                }}
              >
                Questions
              </p>

              <h2
                className="mt-1 font-serif text-2xl"
                style={{
                  color:
                    WITS_BLUE,
                }}
              >
                Existing challenges
              </h2>
            </div>

            <span className="rounded-full bg-[#043673]/5 px-3 py-1 text-xs font-semibold text-[#043673]">
              {challenges.length}
            </span>
          </div>

          {challenges.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-sm text-slate-500">
                No questions have been added to this event yet.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {challenges.map(
                (
                  challenge,
                  index
                ) => (
                  <div
                    key={
                      challenge.id
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-[#043673]">
                            Question{" "}
                            {index + 1}
                          </p>

                          <span className="rounded-full bg-white px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                            {challenge.question_type ===
                            "multiple_choice"
                              ? "Multiple choice"
                              : challenge.question_type ===
                                  "true_false"
                                ? "True / False"
                                : "Text"}
                          </span>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-slate-700">
                          {
                            challenge.question_text
                          }
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            editChallenge(
                              challenge
                            )
                          }
                          className="rounded-lg border border-[#043673]/15 bg-white px-3 py-2 text-xs font-semibold text-[#043673]"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteChallenge(
                              challenge.id
                            )
                          }
                          className="rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* OPTIONS */}

                    {challenge.question_type ===
                      "multiple_choice" &&
                      challenge.options && (
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          {challenge.options.map(
                            (
                              option
                            ) => (
                              <div
                                key={
                                  option
                                }
                                className={`rounded-xl border px-3 py-2 text-xs ${
                                  option ===
                                  challenge.correct_answer
                                    ? "border-emerald-200 bg-emerald-50 font-semibold text-emerald-700"
                                    : "border-slate-200 bg-white text-slate-600"
                                }`}
                              >
                                {
                                  option
                                }

                                {option ===
                                  challenge.correct_answer && (
                                  <span className="ml-2">
                                    ✓
                                  </span>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      )}

                    {/* TRUE / FALSE */}

                    {challenge.question_type ===
                      "true_false" && (
                      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                        Correct answer:{" "}
                        {
                          challenge.correct_answer
                        }
                      </div>
                    )}

                    {/* TEXT */}

                    {challenge.question_type ===
                      "text" && (
                      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                        Correct answer:{" "}
                        {
                          challenge.correct_answer
                        }
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}