function detectMood(message) {
    if (!message) return "neutral";

    const text = String(message).toLowerCase();

    // Crisis / self-harm keywords — highest priority
    const crisisKeywords = [
        "suicide",
        "kill myself",
        "hurt myself",
        "self-harm",
        "end my life",
        "want to die",
        "i want to die",
        "i'm going to end",
        "no reason to live",
        "i don't want to live",
        "kill me"
    ];

    for (const kw of crisisKeywords) {
        if (text.includes(kw)) return "crisis";
    }

    if (text.includes("sad") || text.includes("depressed") || text.includes("lonely")) {
        return "sad";
    }

    if (text.includes("stress") || text.includes("anxious") || text.includes("worried")) {
        return "stressed";
    }

    if (text.includes("happy") || text.includes("excited") || text.includes("great")) {
        return "happy";
    }

    return "neutral";
}

module.exports = detectMood;