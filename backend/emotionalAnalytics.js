/**
 * Emotional Analytics Module
 * Tracks mood events and provides analytics summaries
 */

let moodEvents = [];

/**
 * Record a mood event
 * @param {string} mood - The mood detected/selected
 * @param {string} source - Where the mood came from ('daily-checkin' or 'chat')
 * @returns {object} The recorded event
 */
function recordMoodEvent(mood, source = "chat") {
    if (!mood) return null;

    const event = {
        id: Date.now(),
        mood,
        source,
        timestamp: new Date()
    };

    moodEvents.push(event);
    return event;
}

/**
 * Get all mood events
 * @returns {array} Array of mood events
 */
function getMoodEvents() {
    return moodEvents;
}

/**
 * Get analytics summary
 * @returns {object} Summary of mood patterns
 */
function getAnalyticsSummary() {
    if (moodEvents.length === 0) {
        return {
            stressFrequency: 0,
            moodHistory: [],
            trend: "No data yet. Check in daily to see patterns!"
        };
    }

    // Get stress frequency (count of 'stressed' moods)
    const stressFrequency = moodEvents.filter(e => e.mood === "stressed").length;

    // Get mood history (last 30 events, most recent first)
    const moodHistory = moodEvents
        .slice(-30)
        .reverse()
        .map(e => ({
            mood: e.mood,
            timestamp: e.timestamp,
            source: e.source
        }));

    // Calculate trend based on recent moods
    const recentMoods = moodEvents.slice(-10).map(e => e.mood);
    const recentStressCount = recentMoods.filter(m => m === "stressed").length;
    const recentSadCount = recentMoods.filter(m => m === "sad").length;
    const recentHappyCount = recentMoods.filter(m => m === "happy").length;

    let trend = "Balanced mood overall.";
    if (recentStressCount > recentHappyCount + 2) {
        trend = "High stress detected recently. Consider taking a break.";
    } else if (recentSadCount > 3) {
        trend = "Some sadness recently. Remember to reach out to someone.";
    } else if (recentHappyCount > 5) {
        trend = "Great positive energy recently! Keep it up!";
    } else if (recentStressCount === 0 && recentMoods.length > 0) {
        trend = "Peaceful period lately. Enjoy this calm!";
    }

    return {
        totalEvents: moodEvents.length,
        stressFrequency,
        moodHistory,
        trend,
        lastUpdate: moodEvents[moodEvents.length - 1].timestamp
    };
}

/**
 * Clear all analytics (for testing)
 */
function clearAnalytics() {
    moodEvents = [];
}

module.exports = {
    recordMoodEvent,
    getMoodEvents,
    getAnalyticsSummary,
    clearAnalytics
};
