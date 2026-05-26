const MOOD_RULES = [
  {
    key: "crisis",
    label: "Crisis",
    keywords: [
      "suicide",
      "kill myself",
      "hurt myself",
      "self-harm",
      "self harm",
      "end it",
      "end it all",
      "end my life",
      "no reason to live",
      "want to die",
      "i want to die",
      "don't want to live",
      "not worth living",
      "worthless",
      "give up"
    ]
  },
  { key: "anxious", label: "Anxious", keywords: ["anxious", "overwhelmed", "panic", "nervous", "stress", "worried"] },
  { key: "sad", label: "Sad", keywords: ["sad", "down", "lonely", "cry", "hurt", "empty"] },
  { key: "angry", label: "Angry", keywords: ["angry", "mad", "frustrated", "annoyed", "upset"] },
  { key: "hopeful", label: "Hopeful", keywords: ["hope", "trying", "better", "healing", "improve"] },
  { key: "grateful", label: "Grateful", keywords: ["grateful", "thankful", "blessed", "appreciate"] },
  { key: "happy", label: "Happy", keywords: ["happy", "joy", "excited", "great", "good"] },
  { key: "calm", label: "Calm", keywords: ["calm", "peace", "steady", "grounded", "relaxed"] }
];

export function inferMood(text) {
  const normalized = String(text || "").toLowerCase();

  for (const rule of MOOD_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule;
    }
  }

  return { key: "neutral", label: "Neutral" };
}

export function collectMoods(posts) {
  const map = new Map();

  posts.forEach((post) => {
    const mood = inferMood(post.text);
    if (!map.has(mood.key)) {
      map.set(mood.key, mood.label);
    }
  });

  return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
}

export const MOOD_OPTIONS = [
  { key: "happy", label: "Happy" },
  { key: "lonely", label: "Lonely" },
  { key: "stressed", label: "Stressed" },
  { key: "tired", label: "Tired" },
  { key: "sad", label: "Sad" }
];
