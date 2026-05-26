const checkIns = [];

function addCheckIn(mood, note = null) {
    const newItem = {
        id: Date.now(),
        mood,
        note,
        timestamp: new Date()
    };

    checkIns.unshift(newItem);

    return newItem;
}

function getCheckIns() {
    return checkIns;
}

module.exports = {
    addCheckIn,
    getCheckIns
};
