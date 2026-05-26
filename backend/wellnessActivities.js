const WELLNESS_BY_MOOD = {
    happy: {
        key: "gratitude",
        title: "Keep the momentum going",
        description: "Write down 3 things you're grateful for or share one good moment with someone.",
        icon: "✨"
    },
    lonely: {
        key: "connection",
        title: "Gentle connection check",
        description: "Send one small message to someone you trust, even just a hello.",
        icon: "🤝"
    },
    stressed: {
        key: "breathing",
        title: "Breathing reset",
        description: "Try 4 slow breaths in, 4 hold, 6 out. Repeat 5 times and unclench your shoulders.",
        icon: "🌿"
    },
    tired: {
        key: "hydration",
        title: "Hydrate and pause",
        description: "Have a glass of water, stand up, and take a 2-minute stretch break.",
        icon: "💧"
    },
    sad: {
        key: "comfort",
        title: "Comfort first",
        description: "Try a calming activity like a warm drink, quiet music, or a short walk outside.",
        icon: "🫶"
    },
    neutral: {
        key: "steady",
        title: "Small reset",
        description: "Take one slow breath and notice one thing that feels okay right now.",
        icon: "🕊️"
    }
};

function getWellnessActivity(mood) {
    return WELLNESS_BY_MOOD[mood] || WELLNESS_BY_MOOD.neutral;
}

module.exports = {
    getWellnessActivity
};