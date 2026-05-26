import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "./App.css";
import Hero from "./components/Hero";
import DailyCheckIn from "./components/DailyCheckIn";
import { MOOD_OPTIONS } from "./utils/postMood";
import { getAnalytics } from "./services/communityApi";
import AnalyticsPanel from "./components/AnalyticsPanel";

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("faith-theme") || "light"; } catch { return "light"; }
  });
  const [moodAnalytics, setMoodAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const chatEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const [showHero, setShowHero] = useState(true);
  const [currentMood, setCurrentMood] = useState(null);
  const [showDailyCheckIn, setShowDailyCheckIn] = useState(false);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    // delay scrolling slightly to allow layout changes (avoid sudden jump on view transitions)
    if (!chatEndRef.current) return;
    try {
      window.requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    } catch (e) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
    }
  };

  useEffect(() => {
    // ensure scroll runs after render/layout stabilizes
    const t = setTimeout(() => scrollToBottom(), 60);
    return () => clearTimeout(t);
  }, [chat]);

  useEffect(() => {
    try {
      const todayKey = new Date().toISOString().slice(0, 10);
      const has = localStorage.getItem(`checkin-${todayKey}`);
      if (!has) setShowDailyCheckIn(true);
    } catch {
      // ignore localStorage
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("theme-light", "theme-dark");
    document.documentElement.classList.add(`theme-${theme}`);
    try {
      localStorage.setItem("faith-theme", theme);
    } catch {
      // Ignore localStorage write failures (private mode, disabled storage).
    }
  }, [theme]);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const data = await getAnalytics();
        setMoodAnalytics(data);
      } catch (error) {
        console.log("Analytics not yet available:", error);
      }
    }
    fetchAnalytics();
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    setShowHero(false);

    const userMsg = {
      sender: "user",
      text: message
    };

    setChat(prev => [...prev, userMsg]);
    setMessage("");

    // Client-side crisis interception: check message for high-priority self-harm keywords
    try {
      const lower = message.toLowerCase();
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

      if (crisisKeywords.some((kw) => lower.includes(kw))) {
        const safeReply = "I'm really sorry you're feeling this way — I'm here with you. If you are in immediate danger, please call your local emergency services right now. If you're in the United States, you can call or text 988 to reach the Suicide & Crisis Lifeline. If you're elsewhere, please contact your local emergency number or a crisis hotline. Would you like to tell me more about what's happening, or should I help find local resources or a trusted person to contact?";

        setChat((prev) => [...prev, { sender: "faith", text: safeReply }]);
        setLoading(false);
        return;
      }
    } catch (e) {
      // ignore client-side detection errors and fall back to server flow
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message, mood: currentMood, dailyMood: currentMood })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.reply) {
        throw new Error("Invalid response from server");
      }

      const botMsg = {
        sender: "faith",
        text: data.reply,
        wellnessActivity: data.wellnessActivity || null
      };

      setChat(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = error.message?.includes("Failed to fetch")
        ? "Connection failed. Please check if the backend server is running."
        : "Sorry, I encountered an error. Please try again.";
      
      setChat(prev => [...prev, {
        sender: "faith",
        text: errorMessage
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {showDailyCheckIn && (
        <DailyCheckIn
          onClose={() => setShowDailyCheckIn(false)}
          onSetMood={(m) => setCurrentMood(m)}
        />
      )}
      {!showHero && currentMood && (
        <div style={{position:'absolute', right:14, top:14, display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end'}}>
          {moodAnalytics && moodAnalytics.totalEvents > 0 && (
            <div className="analytics-card" aria-label="Mood analytics summary">
              <div className="analytics-card__title">📊 Your mood insights</div>
              <div className="analytics-card__stat">Stress events: <strong>{moodAnalytics.stressFrequency}</strong></div>
              <div className="analytics-card__trend">{moodAnalytics.trend}</div>
            </div>
          )}
          <span className="mood-badge" aria-hidden>
            {(() => {
              const map = { happy: '😊', lonely: '😔', stressed: '😰', tired: '😴', sad: '😢' };
              const label = MOOD_OPTIONS.find(x => x.key === currentMood)?.label || currentMood;
              return <>{map[currentMood] || '💬'} {label}</>;
            })()}
          </span>
        </div>
      )}
      {!showHero && (
        <header className="app-header">
          <div className="header-content">
            <div className="header-row">
              <p className="brand-mark">Faith AI</p>
              <div className="header-actions">
                <Link className="header-link" to="/community">Community</Link>
                <button                  className="analytics-btn"
                  onClick={async () => {
                    try {
                      const data = await getAnalytics();
                      setMoodAnalytics(data);
                    } catch (e) {
                      console.log('Analytics fetch failed', e);
                    }
                    setShowAnalytics(true);
                  }}
                  title="Open analytics"
                >
                  Analytics
                </button>
                <button                  aria-label="Toggle theme"
                  className="theme-toggle"
                  onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
                  title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
                >
                  {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                </button>
              </div>
            </div>
            <h1 className="app-title">Faith AI Conversation</h1>
            <p className="app-subtitle">Stay in the same mood as the homepage while chatting.</p>
          </div>
        </header>
      )}

      <div className="chat-area">
        {showHero && chat.length === 0 ? (
          <Hero
            onEnter={() => {
              setShowHero(false);
              setTimeout(() => messageInputRef.current?.focus(), 80);
            }}
            onCommunity={() => navigate("/community")}
          />
        ) : (
          <div className="messages">
            <AnimatePresence initial={false}>
              {chat.map((msg, index) => (
                <motion.div
                  key={`${msg.sender}-${index}-${msg.text.slice(0, 16)}`}
                  className={`message-wrapper ${msg.sender === "user" ? "user" : "bot"}`}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <div className="message-stack">
                    <div className={`message ${msg.sender === "user" ? "user-message" : "bot-message"}`}>
                      {msg.text}
                    </div>
                    {msg.sender === "faith" && msg.wellnessActivity && (
                      <div className="wellness-card" aria-label="Faith wellness suggestion">
                        <div className="wellness-card__icon" aria-hidden="true">{msg.wellnessActivity.icon}</div>
                        <div className="wellness-card__content">
                          <p className="wellness-card__eyebrow">Small wellness step</p>
                          <p className="wellness-card__title">{msg.wellnessActivity.title}</p>
                          <p className="wellness-card__description">{msg.wellnessActivity.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <motion.div
                  className="message-wrapper bot"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="message bot-message loading" role="status" aria-live="polite" aria-label="Faith is typing">
                    <div style={{display:'flex', flexDirection:'column', gap:6}}>
                      <span className="typing-text">Faith is typing...</span>
                      <div style={{display:'flex', gap:6}}>
                        <span className="typing-dot" aria-hidden></span>
                        <span className="typing-dot" aria-hidden></span>
                        <span className="typing-dot" aria-hidden></span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {!showHero && (
        <form className="input-section" onSubmit={sendMessage}>
          <div className="composer-shell">
            <input
              ref={messageInputRef}
              type="text"
              className="message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
            />
            <button
              type="submit"
              className="send-button"
              disabled={loading || !message.trim()}
            >
              <span>{loading ? "Sending" : "Send"}</span>
            </button>
          </div>
          <p className="composer-note">Press Enter to send.</p>
        </form>
      )}

      <AnalyticsPanel
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        data={moodAnalytics}
        fetchEndpoint={import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/analytics` : 'http://localhost:5000/analytics'}
      />
    </div>
  );
}

export default App;