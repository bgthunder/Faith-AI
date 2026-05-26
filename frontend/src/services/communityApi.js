const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function normalizePost(post) {
  return {
    id: post.id,
    text: String(post.text || ""),
    time: post.time || new Date().toISOString()
  };
}

export async function getCommunityPosts() {
  const response = await fetch(`${API_BASE}/community`);

  if (!response.ok) {
    throw new Error("Failed to load community posts.");
  }

  const data = await response.json();
  if (!Array.isArray(data)) return [];

  return data.map(normalizePost);
}

export async function createCommunityPost(text) {
  const response = await fetch(`${API_BASE}/community`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    let message = "Unable to create post.";
    try {
      const errorBody = await response.json();
      message = errorBody.error || message;
    } catch {
      // Keep fallback message when response body is not JSON.
    }
    throw new Error(message);
  }

  const created = await response.json();
  return normalizePost(created);
}

export async function submitDailyCheckIn(mood, note = null) {
  const response = await fetch(`${API_BASE}/daily-checkin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ mood, note, timestamp: new Date().toISOString() })
  });

  if (!response.ok) {
    let message = "Unable to submit check-in.";
    try {
      const errorBody = await response.json();
      message = errorBody.error || message;
    } catch {
      // fallback
    }
    throw new Error(message);
  }

  return await response.json();
}

export async function getAnalytics() {
  const response = await fetch(`${API_BASE}/analytics`);

  if (!response.ok) {
    throw new Error("Failed to load analytics.");
  }

  return await response.json();
}
