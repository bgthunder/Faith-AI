const memory = {};
const checkIns = {};

function saveMemory(userId, message) {

    if (!memory[userId]) {
        memory[userId] = [];
    }

    memory[userId].push(message);

    if (memory[userId].length > 5) {
        memory[userId].shift();
    }
}

function getMemory(userId) {
    return memory[userId] || [];
}

function saveDailyCheckIn(userId, mood) {
    const today = new Date().toISOString().split('T')[0];
    if (!checkIns[userId]) {
        checkIns[userId] = {};
    }
    checkIns[userId][today] = mood;
}

function getDailyCheckIn(userId) {
    const today = new Date().toISOString().split('T')[0];
    if (!checkIns[userId]) {
        return null;
    }
    return checkIns[userId][today] || null;
}

module.exports = {
    saveMemory,
    getMemory,
    saveDailyCheckIn,
    getDailyCheckIn
};