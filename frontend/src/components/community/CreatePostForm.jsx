import { useState } from "react";

const LIMIT = 280;

export default function CreatePostForm({ onCreate, isSubmitting, error }) {
  const [text, setText] = useState("");
  const [localError, setLocalError] = useState("");

  const remaining = LIMIT - text.length;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmed = text.trim();
    if (!trimmed) {
      setLocalError("Post cannot be empty.");
      return;
    }

    if (trimmed.length > LIMIT) {
      setLocalError(`Keep your post under ${LIMIT} characters.`);
      return;
    }

    setLocalError("");
    await onCreate(trimmed);
    setText("");
  };

  return (
    <form className="community-composer" onSubmit={handleSubmit}>
      <label className="composer-label" htmlFor="community-post-input">Share anonymously</label>
      <textarea
        id="community-post-input"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (localError) setLocalError("");
        }}
        maxLength={LIMIT}
        rows={4}
        className="community-textarea"
        placeholder="Share what you are feeling..."
        disabled={isSubmitting}
      />
      <div className="composer-footer">
        <p className={`composer-count ${remaining < 30 ? "warn" : ""}`}>{remaining} characters left</p>
        <button className="community-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Posting..." : "Post Anonymously"}
        </button>
      </div>
      {(localError || error) && <p className="composer-error" role="alert">{localError || error}</p>}
    </form>
  );
}
