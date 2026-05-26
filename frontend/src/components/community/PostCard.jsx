function formatTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export default function PostCard({ post, mood }) {
  return (
    <article className="post-card">
      <div className="post-meta">
        <span className={`post-mood post-mood-${mood.key}`}>{mood.label}</span>
        <span className="post-time">{formatTimestamp(post.time)}</span>
      </div>
      <p className="post-text">{post.text}</p>
    </article>
  );
}
