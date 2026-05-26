export default function EmotionalFilterBar({ moods, activeMood, onChange }) {
  return (
    <div className="mood-filter" role="toolbar" aria-label="Emotional feed filters">
      <button
        type="button"
        className={`mood-chip ${activeMood === "all" ? "active" : ""}`}
        onClick={() => onChange("all")}
      >
        All
      </button>
      {moods.map((mood) => (
        <button
          key={mood.key}
          type="button"
          className={`mood-chip ${activeMood === mood.key ? "active" : ""}`}
          onClick={() => onChange(mood.key)}
        >
          {mood.label}
        </button>
      ))}
    </div>
  );
}
