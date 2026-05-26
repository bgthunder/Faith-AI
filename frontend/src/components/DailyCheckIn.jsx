import { useState } from "react";
import { MOOD_OPTIONS } from "../utils/postMood";
import { submitDailyCheckIn } from "../services/communityApi";
import "../styles/dailyCheckin.css";

const LIMIT = 280;

export default function DailyCheckIn({ onClose, onSetMood }) {
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remaining = LIMIT - note.length;

  const handleSubmit = async (e) => {
    e && e.preventDefault();

    if (!selected) {
      setError("Please choose how you're feeling.");
      return;
    }

    if (note.length > LIMIT) {
      setError(`Keep your note under ${LIMIT} characters.`);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await submitDailyCheckIn(selected, note || null);
      try {
        const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        localStorage.setItem(`checkin-${todayKey}`, "1");
      } catch {}

      onSetMood && onSetMood(selected);
      onClose && onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to submit check-in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="daily-checkin-modal" role="presentation" onClick={() => onClose && onClose()}>
      <form className="daily-checkin" role="dialog" aria-modal="true" aria-label="Daily emotional check-in" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>How are you feeling today?</h2>
        <div className="mood-options">
          {MOOD_OPTIONS.map((m) => (
            <button
              type="button"
              key={m.key}
              className={`mood-button ${selected === m.key ? "selected" : ""}`}
              onClick={() => { setSelected(m.key); if (error) setError(""); }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <label htmlFor="daily-note" className="composer-label">Optional note</label>
        <textarea
          id="daily-note"
          value={note}
          onChange={(e) => { setNote(e.target.value); if (error) setError(""); }}
          maxLength={LIMIT}
          rows={3}
          placeholder="Add a brief note (optional)"
          disabled={isSubmitting}
        />

        <div className="composer-footer">
          <p className={`composer-count ${remaining < 30 ? "warn" : ""}`}>{remaining} characters left</p>
          <div className="daily-actions">
            <button type="button" className="daily-cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="daily-submit" disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit"}</button>
          </div>
        </div>

        {error && <p className="composer-error" role="alert">{error}</p>}
      </form>
    </div>
  );
}
