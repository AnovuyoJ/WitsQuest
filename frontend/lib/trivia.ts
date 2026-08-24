export type Difficulty = "Easy" | "Medium" | "Hard";

export type TriviaQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: Difficulty;
  points: number;
};

export type TriviaEvent = {
  id: string;
  title: string;
  location: string;
  description: string;
  activeWindow: string;
  accent: string;
};

export type EarnedCard = {
  id: string;
  eventId: string;
  title: string;
  initials: string;
  prompt: string;
  difficulty: Difficulty;
  points: number;
  earnedAt: string;
};

export const greatHallEvent: TriviaEvent = {
  id: "great-hall-trivia",
  title: "The Great Hall",
  location: "Wits Great Hall",
  description: "Campus heritage and tradition challenge at Wits' iconic Great Hall.",
  activeWindow: "Open to everyone",
  accent: "#043673",
};

export const solomonMahlanguHouseEvent: TriviaEvent = {
  id: "solomon-mahlangu-house",
  title: "Solomon Mahlangu House",
  location: "Solomon Mahlangu House",
  description: "History and student movement challenge at Wits' central civic landmark.",
  activeWindow: "Open to everyone",
  accent: "#C9A24B",
};

export const chamberOfMinesEvent: TriviaEvent = {
  id: "chamber-of-mines",
  title: "Chamber of Mines Building",
  location: "School of Mining Engineering",
  description: "Engineering and campus infrastructure challenge focused on Wits' mining heritage.",
  activeWindow: "Open to everyone",
  accent: "#043673",
};

export const witsArtMuseumEvent: TriviaEvent = {
  id: "wits-art-museum",
  title: "Wits Art Museum",
  location: "Wits Art Museum",
  description: "A cultural and arts challenge about WAM and its collections.",
  activeWindow: "Open to everyone",
  accent: "#C9A24B",
};

export const eventCatalog: Record<string, TriviaEvent> = {
  "great-hall-trivia": greatHallEvent,
  "solomon-mahlangu-house": solomonMahlanguHouseEvent,
  "chamber-of-mines": chamberOfMinesEvent,
  "wits-art-museum": witsArtMuseumEvent,
};

const greatHallQuestions: TriviaQuestion[] = [
  {
    id: "great-hall-1",
    prompt:
      "According to Wits campus legend, what must students avoid doing before graduation to prevent bad luck or failing exams?",
    options: [
      "Walking through the main gate before orientation",
      "Walking between the front center columns of the Great Hall",
      "Sitting on the steps during exams",
      "Climbing the clock tower",
    ],
    answer: "Walking between the front center columns of the Great Hall",
    explanation: "The Great Hall superstition warns students against walking between the front central columns before graduation.",
    difficulty: "Easy",
    points: 100,
  },
  {
    id: "great-hall-2",
    prompt: "In what architectural style is the grand entrance portico of the Great Hall designed?",
    options: [
      "Modernist",
      "Classical Greek Revival (Neoclassical)",
      "Gothic revival",
      "Art Deco",
    ],
    answer: "Classical Greek Revival (Neoclassical)",
    explanation: "The Great Hall's portico reflects a neoclassical style inspired by classical Greek architecture.",
    difficulty: "Easy",
    points: 100,
  },
  {
    id: "great-hall-3",
    prompt: "In which decade was the Great Hall officially completed and opened?",
    options: ["1890s", "1910s", "1920s", "1930s"],
    answer: "1920s",
    explanation: "The Great Hall was officially completed and opened in the 1920s, with the building opening in 1925.",
    difficulty: "Medium",
    points: 200,
  },
  {
    id: "great-hall-4",
    prompt: "Which prominent historic library building sits directly opposite the Great Hall across the Library Lawns?",
    options: [
      "The Origins Centre",
      "William Cullen Library",
      "The Wits Theatre",
      "The Donald Gordon Medical Centre",
    ],
    answer: "William Cullen Library",
    explanation: "The Great Hall faces William Cullen Library across the Library Lawns, making it a central civic landmark.",
    difficulty: "Medium",
    points: 200,
  },
  {
    id: "great-hall-5",
    prompt: "Which architectural firm originally designed the Great Hall alongside early East Campus buildings?",
    options: [
      "GAPP Architects",
      "Boogertman + Partners",
      "Emley & Williamson (Frank Emley)",
      "Mecanoo",
    ],
    answer: "Emley & Williamson (Frank Emley)",
    explanation: "Frank Emley and Emley & Williamson were responsible for the design of the Great Hall and associated early campus work.",
    difficulty: "Hard",
    points: 300,
  },
];

const solomonMahlanguHouseQuestions: TriviaQuestion[] = [
  {
    id: "solomon-mahlangu-house-1",
    prompt: "What was Solomon Mahlangu House officially named prior to its renaming in 2016?",
    options: ["Old Main", "Senate House", "The Concourse", "University Hall"],
    answer: "Senate House",
    explanation: "Before being renamed, the building was officially known as Senate House.",
    difficulty: "Easy",
    points: 100,
  },
  {
    id: "solomon-mahlangu-house-2",
    prompt: "What anti-apartheid struggle figure and Umkhonto we Sizwe member is the building named after?",
    options: ["Chris Hani", "Solomon Kalushi Mahlangu", "Nelson Mandela", "Steve Biko"],
    answer: "Solomon Kalushi Mahlangu",
    explanation: "The building is named after Solomon Kalushi Mahlangu, a key anti-apartheid martyr.",
    difficulty: "Easy",
    points: 100,
  },
  {
    id: "solomon-mahlangu-house-3",
    prompt: "What is the wide, open ground-floor transit area of this building commonly called by students?",
    options: ["The Forum", "The Plaza", "The Concourse", "The Atrium"],
    answer: "The Concourse",
    explanation: "Students commonly refer to the wide ground-floor through-space as the Concourse.",
    difficulty: "Medium",
    points: 200,
  },
  {
    id: "solomon-mahlangu-house-4",
    prompt: "Solomon Mahlangu House served as the main gathering hub during which national student movement in 2015–2016?",
    options: ["RhodesMustFall", "Fees Must Fall", "Fallist Rebellion", "Student Leadership Week"],
    answer: "Fees Must Fall",
    explanation: "The building became a major rally point and meeting place during the Fees Must Fall movement.",
    difficulty: "Medium",
    points: 200,
  },
  {
    id: "solomon-mahlangu-house-5",
    prompt: "Which major administrative body of the university historically held its formal debates in the council chambers on the upper floors?",
    options: [
      "The Wits University Senate",
      "The SRC Executive",
      "The Council of the University",
      "The Faculty Board",
    ],
    answer: "The Wits University Senate",
    explanation: "The Senate traditionally held formal debates and meetings in the upper council chambers.",
    difficulty: "Hard",
    points: 300,
  },
];

const chamberOfMinesQuestions: TriviaQuestion[] = [
  {
    id: "chamber-of-mines-1",
    prompt: "Which main engineering field is housed inside the Chamber of Mines building?",
    options: ["Civil Engineering", "Mining Engineering", "Mechanical Engineering", "Architecture"],
    answer: "Mining Engineering",
    explanation: "The building is closely tied to Mining Engineering and the mining sciences at Wits.",
    difficulty: "Easy",
    points: 100,
  },
  {
    id: "chamber-of-mines-2",
    prompt: "What unique facility is built inside the basement level for student practical training?",
    options: [
      "An underground mine shaft replica",
      "A chemistry lab",
      "A robotics workshop",
      "A design studio",
    ],
    answer: "An underground mine shaft replica",
    explanation: "The basement includes a full-scale mock underground mine shaft for practical teaching and training.",
    difficulty: "Easy",
    points: 100,
  },
  {
    id: "chamber-of-mines-3",
    prompt: "What organization originally funded and sponsored the construction of the building?",
    options: [
      "The Minerals Council South Africa",
      "The Chamber of Mines of South Africa",
      "The South African Government",
      "The Gauteng Chamber of Commerce",
    ],
    answer: "The Chamber of Mines of South Africa",
    explanation: "The original construction was sponsored and funded by the Chamber of Mines of South Africa.",
    difficulty: "Medium",
    points: 200,
  },
  {
    id: "chamber-of-mines-4",
    prompt: "Why are the basement and lower floors designed with extra-thick, reinforced concrete?",
    options: [
      "To stop flooding from nearby rainfall",
      "To absorb heavy vibrations from industrial rock-crushing and testing machinery",
      "To support a rooftop garden",
      "To create soundproof exam rooms",
    ],
    answer: "To absorb heavy vibrations from industrial rock-crushing and testing machinery",
    explanation: "The reinforced structure absorbs the vibration and load from heavy mining machinery and rock-testing equipment.",
    difficulty: "Medium",
    points: 200,
  },
  {
    id: "chamber-of-mines-5",
    prompt: "Aside from Mining Engineering, which related materials engineering department shares facilities in this building?",
    options: [
      "Metallurgical Engineering",
      "Architecture",
      "Electrical Engineering",
      "Biomedical Engineering",
    ],
    answer: "Metallurgical Engineering",
    explanation: "Metallurgical Engineering is the related materials discipline that shares the same facilities in the building.",
    difficulty: "Hard",
    points: 300,
  },
];

const witsArtMuseumQuestions: TriviaQuestion[] = [
  {
    id: "wits-art-museum-1",
    prompt: "On the corner of which two major Braamfontein roads is the Wits Art Museum located?",
    options: [
      "Jan Smuts Avenue and Jorissen Street",
      "Oxford Road and Jan Smuts Avenue",
      "Berea Road and De Korte Street",
      "M1 and Empire Road",
    ],
    answer: "Jan Smuts Avenue and Jorissen Street",
    explanation: "WAM is located on the corner of Jan Smuts Avenue and Jorissen Street in Braamfontein.",
    difficulty: "Easy",
    points: 100,
  },
  {
    id: "wits-art-museum-2",
    prompt: "What commercial business occupied the building before it was converted into an art gallery?",
    options: [
      "A car dealership and service station",
      "A cinema",
      "A textile factory",
      "A pharmacy",
    ],
    answer: "A car dealership and service station",
    explanation: "The building originally operated as a Lawson Motors car dealership and service station before becoming WAM.",
    difficulty: "Easy",
    points: 100,
  },
  {
    id: "wits-art-museum-3",
    prompt: "What regional focus characterizes the majority of the museum's permanent collections?",
    options: [
      "European Renaissance art",
      "Sub-Saharan African art",
      "Asian contemporary art",
      "South American sculpture",
    ],
    answer: "Sub-Saharan African art",
    explanation: "WAM's permanent collections are strongly centred on historical, modern, and contemporary art from Sub-Saharan Africa.",
    difficulty: "Medium",
    points: 200,
  },
  {
    id: "wits-art-museum-4",
    prompt: "In what year was the newly redeveloped WAM gallery space officially opened to the public?",
    options: ["2008", "2010", "2012", "2015"],
    answer: "2012",
    explanation: "The newly redeveloped WAM gallery space officially opened in 2012.",
    difficulty: "Medium",
    points: 200,
  },
  {
    id: "wits-art-museum-5",
    prompt: "Approximately how many African artworks are stored within WAM's subterranean vault collections?",
    options: [
      "Over 1,500 artworks",
      "Over 5,000 artworks",
      "Over 15,000 artworks",
      "Over 50,000 artworks",
    ],
    answer: "Over 15,000 artworks",
    explanation: "WAM's subterranean vault collections hold more than 15,000 African artworks.",
    difficulty: "Hard",
    points: 300,
  },
];

const eventQuestions: Record<string, TriviaQuestion[]> = {
  "great-hall-trivia": greatHallQuestions,
  "solomon-mahlangu-house": solomonMahlanguHouseQuestions,
  "chamber-of-mines": chamberOfMinesQuestions,
  "wits-art-museum": witsArtMuseumQuestions,
};

export function getRandomQuestionDeckForEvent(eventId: string): TriviaQuestion[] {
  const questions = eventQuestions[eventId] ?? greatHallQuestions;

  return [...questions].sort(() => Math.random() - 0.5).slice(0, 5);
}

export function getRandomQuestionDeck(): TriviaQuestion[] {
  return getRandomQuestionDeckForEvent("great-hall-trivia");
}

export function getEventBadgeInitials(eventTitle: string): string {
  return (
    eventTitle
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 3) || "WQ"
  );
}

export function getSavedEarnedCards(): EarnedCard[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem("witsQuestEarnedCards");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEarnedCards(cards: EarnedCard[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("witsQuestEarnedCards", JSON.stringify(cards));
}
