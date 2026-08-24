"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  loadSavedChallenges,
  saveSavedChallenges,
  type SavedChallenge,
} from "@/lib/adminChallenges";

const WITS_BLUE = "#043673";
const WITS_GOLD = "#C9A24B";
const ADMIN_GITHUB_USERNAME = "nessaforealz";
const QUESTION_CATEGORIES = [
  "Alumni",
  "History",
  "Landmarks",
  "Arts",
  "Science",
  "Culture",
  "Campus Life",
  "Sports",
  "Student Leadership",
  "Other",
];
const WITS_LOCATIONS = [
  "Great Hall",
  "Wits Art Museum",
  "Solomon Mahlangu House",
  "Origins Centre",
  "Chamber of Mines",
  "Old Main Building",
  "Wits Science Stadium",
  "Barnato Hall",
  "Muller Hall",
  "The Clock Tower",
  "Wits Health Sciences Building",
  "Library Law Building",
  "Braamfontein Campus",
  "M1 Main Gate",
  "University Corner",
  "Wits Theatre",
  "The Matrix",
  "Moses Mabhida Road",
  "M2 Access Route",
  "Wits Student Union",
  "Wits Business School",
  "The Great Hall",
  "Bennet & Bloom",
  "FNB Building",
  "Wits Village",
  "Wits West Campus",
  "School of Governance",
  "Education Campus",
  "Bunting Road",
];

function getGitHubUsernameCandidates(user: any): string[] {
  if (!user) return [];

  const values = [
    user?.user_metadata?.user_name,
    user?.user_metadata?.login,
    user?.user_metadata?.preferred_username,
    user?.user_metadata?.name,
    user?.email?.split("@")[0],
    user?.identities?.map((identity: any) => identity?.identity_data?.user_name),
    user?.identities?.map((identity: any) => identity?.identity_data?.login),
    user?.identities?.map((identity: any) => identity?.identity_data?.preferred_username),
  ];

  return values
    .flat()
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isAdminGitHubUser(user: any) {
  if (!user) return false;

  const candidates = getGitHubUsernameCandidates(user).map((value) => value.toLowerCase());
  return candidates.includes(ADMIN_GITHUB_USERNAME);
}

type ChallengeFormState = {
  title: string;
  location: string;
  description: string;
  question: string;
  answer: string;
  options: string;
  difficulty: "Easy" | "Medium" | "Hard";
  points: string;
  openToEveryone: boolean;
  category: string;
  customCategory: string;
};

const initialFormState: ChallengeFormState = {
  title: "",
  location: "",
  description: "",
  question: "",
  answer: "",
  options: "",
  difficulty: "Medium",
  points: "20",
  openToEveryone: true,
  category: "Landmarks",
  customCategory: "",
};

export default function AdminEventsPage() {
  const router = useRouter();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [githubUser, setGithubUser] = useState("");
  const [formState, setFormState] = useState<ChallengeFormState>(initialFormState);
  const [savedChallenges, setSavedChallenges] = useState<SavedChallenge[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const filteredLocations = useMemo(() => {
    if (!formState.location.trim()) return WITS_LOCATIONS.slice(0, 8);

    const query = formState.location.trim().toLowerCase();
    return WITS_LOCATIONS.filter((location) =>
      location.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [formState.location]);

  useEffect(() => {
    setSavedChallenges(loadSavedChallenges());

    async function verifyAdminAccess() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      const username = getGitHubUsernameCandidates(user)[0] || user?.email || "Unknown user";
      const adminAccess = isAdminGitHubUser(user);

      setGithubUser(username);
      setIsAdmin(adminAccess);
      setCheckingAccess(false);

      if (!adminAccess) {
        router.replace("/dashboard");
      }
    }

    verifyAdminAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      const username = getGitHubUsernameCandidates(user)[0] || user?.email || "Unknown user";
      const adminAccess = isAdminGitHubUser(user);

      setGithubUser(username);
      setIsAdmin(adminAccess);
      setCheckingAccess(false);

      if (!adminAccess) {
        router.replace("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  function updateField<K extends keyof ChallengeFormState>(field: K, value: ChallengeFormState[K]) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const title = formState.title.trim();
    const location = formState.location.trim();
    const description = formState.description.trim();
    const question = formState.question.trim();
    const answer = formState.answer.trim();
    const points = Number(formState.points) || 0;
    const finalCategory = formState.category === "Other" ? formState.customCategory.trim() || "Other" : formState.category;

    if (!title || !location || !description || !question || !answer || !finalCategory) {
      setMessage("Please complete all the required challenge fields, including the category and location.");
      return;
    }

    const nextChallenge: SavedChallenge = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}`,
      title,
      location,
      category: finalCategory,
      description,
      question,
      answer,
      options: formState.options
        .split(",")
        .map((option) => option.trim())
        .filter(Boolean),
      difficulty: formState.difficulty,
      points,
      openToEveryone: formState.openToEveryone,
      createdAt: new Date().toISOString(),
      published: false,
      card: null,
    };

    const nextList = [nextChallenge, ...loadSavedChallenges()].slice(0, 25);
    saveSavedChallenges(nextList);
    setSavedChallenges(nextList);
    setFormState(initialFormState);
    setMessage("Challenge created successfully. Go to Cards to define the card and publish this event to the map.");
  }

  if (checkingAccess) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
        Checking admin access…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6 text-center">
        <div className="max-w-md rounded-2xl bg-white p-8 shadow-[0_2px_30px_-8px_rgba(4,54,115,0.15)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A24B]">Restricted</p>
          <h1 className="mt-3 font-serif text-2xl text-[#043673]">Admin access required</h1>
          <p className="mt-2 text-sm text-slate-500">
            Only the GitHub user <span className="font-semibold">Nessaforealz</span> can access this dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2.5">
              <h1 className="font-serif text-3xl tracking-tight" style={{ color: WITS_BLUE }}>
                Admin Events
              </h1>
              <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#C9A24B]">
                Wits Quest
              </span>
            </div>
            <div className="mt-2 h-[3px] w-16 rounded-full bg-gradient-to-r from-[#043673] to-[#C9A24B]" />
          </div>

          <div className="rounded-full border border-[#043673]/15 bg-white px-4 py-2 text-sm font-medium text-[#043673] shadow-sm">
            Signed in as {githubUser}
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={handleSubmit} className="rounded-[28px] bg-white p-6 shadow-[0_2px_24px_-10px_rgba(4,54,115,0.2)]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl text-[#043673]">Create event challenge</h2>
            <span className="rounded-full bg-[#043673]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#043673]">
              Admin tool
            </span>
          </div>

          {message && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-1 block text-sm font-medium text-slate-700">
              Challenge title
              <input
                value={formState.title}
                onChange={(event) => updateField("title", event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#043673] focus:bg-white"
                placeholder="Great Hall Challenge"
              />
            </label>

            <label className="md:col-span-1 block text-sm font-medium text-slate-700">
              Difficulty
              <select
                value={formState.difficulty}
                onChange={(event) => updateField("difficulty", event.target.value as ChallengeFormState["difficulty"])}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#043673] focus:bg-white"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </label>

            <label className="md:col-span-2 block text-sm font-medium text-slate-700">
              Tag / category
              <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 p-2">
                <div className="max-h-32 overflow-y-auto rounded-lg bg-white p-2">
                  {QUESTION_CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => updateField("category", category)}
                      className={`mb-2 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                        formState.category === category
                          ? "bg-[#043673] text-white"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span>{category}</span>
                      {formState.category === category && <span>✓</span>}
                    </button>
                  ))}
                </div>

                {formState.category === "Other" && (
                  <input
                    value={formState.customCategory}
                    onChange={(event) => updateField("customCategory", event.target.value)}
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#043673]"
                    placeholder="Type your custom category"
                  />
                )}
              </div>
            </label>

            <label className="md:col-span-2 block text-sm font-medium text-slate-700">
              Location
              <input
                value={formState.location}
                onChange={(event) => updateField("location", event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#043673] focus:bg-white"
                placeholder="Type a Wits location e.g. Great Hall, Library..."
              />
              {filteredLocations.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                  {filteredLocations.map((location) => (
                    <button
                      key={location}
                      type="button"
                      onClick={() => updateField("location", location)}
                      className="mb-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-white hover:text-[#043673]"
                    >
                      {location}
                    </button>
                  ))}
                </div>
              )}
            </label>

            <label className="md:col-span-2 block text-sm font-medium text-slate-700">
              Description
              <textarea
                value={formState.description}
                onChange={(event) => updateField("description", event.target.value)}
                className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#043673] focus:bg-white"
                placeholder="Describe the challenge and what students should discover at this location."
              />
            </label>

            <label className="md:col-span-2 block text-sm font-medium text-slate-700">
              Question
              <textarea
                value={formState.question}
                onChange={(event) => updateField("question", event.target.value)}
                className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#043673] focus:bg-white"
                placeholder="What historical landmark is this?"
              />
            </label>

            <label className="md:col-span-2 block text-sm font-medium text-slate-700">
              Multiple choice options (comma separated)
              <input
                value={formState.options}
                onChange={(event) => updateField("options", event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#043673] focus:bg-white"
                placeholder="Old Main, The Great Hall, Solomon Mahlangu House, Wits Art Museum"
              />
            </label>

            <label className="md:col-span-1 block text-sm font-medium text-slate-700">
              Correct answer
              <input
                value={formState.answer}
                onChange={(event) => updateField("answer", event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#043673] focus:bg-white"
                placeholder="The Great Hall"
              />
            </label>

            <label className="md:col-span-1 block text-sm font-medium text-slate-700">
              Points
              <input
                type="number"
                min="5"
                max="100"
                value={formState.points}
                onChange={(event) => updateField("points", event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#043673] focus:bg-white"
              />
            </label>

            <label className="md:col-span-2 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700">
              Open to everyone
              <input
                type="checkbox"
                checked={formState.openToEveryone}
                onChange={(event) => updateField("openToEveryone", event.target.checked)}
                className="h-4 w-4 accent-[#043673]"
              />
            </label>
          </div>

          <button
            type="submit"
            className="mt-6 inline-flex items-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            style={{ background: WITS_BLUE }}
          >
            Save challenge
          </button>
        </form>

        <aside className="rounded-[28px] bg-white p-6 shadow-[0_2px_24px_-10px_rgba(4,54,115,0.2)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl text-[#043673]">Recent challenges</h2>
            <span className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: WITS_GOLD }}>
              {savedChallenges.length}
            </span>
          </div>

          {savedChallenges.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
              No challenges created yet.
            </div>
          ) : (
            <div className="space-y-3">
              {savedChallenges.map((challenge) => (
                <div key={challenge.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-[#043673]">{challenge.title}</h3>
                    <span className="rounded-full bg-[#C9A24B]/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#043673]">
                      {challenge.difficulty}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{challenge.location}</p>
                  <p className="mt-2 text-sm text-slate-600">{challenge.question}</p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{challenge.points} pts</span>
                    <span>{challenge.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
