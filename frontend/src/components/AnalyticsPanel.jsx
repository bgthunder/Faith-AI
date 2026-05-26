import React, { useEffect, useMemo, useState } from "react";

const MOOD_SCORE = {
  ecstatic: 4,
  happy: 3,
  neutral: 2,
  down: 1,
  sad: 0,
};

const MOOD_COLOR = {
  ecstatic: "#FFB020",
  happy: "#30C88B",
  neutral: "#9AA7FF",
  down: "#FF7A7A",
  sad: "#B0B0B0",
};

function formatDateShort(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

export default function AnalyticsPanel({
  isOpen,
  onClose = () => {},
  data: suppliedData = null,
  fetchEndpoint = "/api/emotional-analytics",
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(suppliedData);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    if (suppliedData) {
      setData(suppliedData);
      return;
    }
    let isMounted = true;
    setLoading(true);
    setError(null);
    fetch(fetchEndpoint)
      .then((r) => {
        if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!isMounted) return;
        setData(json);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [isOpen, fetchEndpoint, suppliedData]);

  // normalize entries -> { id?, iso, mood, text, score }
  const entries = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data
      .map((e, i) => {
        const iso = e.date || e.iso || e.timestamp || e.createdAt || e.time;
        const mood = (e.mood || e.label || "").toLowerCase();
        const score =
          typeof e.score === "number"
            ? e.score
            : MOOD_SCORE[mood] ?? Number(e.value ?? e.level ?? 0);
        return {
          id: e.id ?? i,
          iso,
          mood: mood || "neutral",
          score: typeof score === "number" ? score : 0,
          text: e.text ?? e.note ?? e.content ?? "",
        };
      })
      .filter((x) => x.iso);
  }, [data]);

  // group per day and compute average score and counts
  const daily = useMemo(() => {
    const map = {};
    entries.forEach((e) => {
      const day = new Date(e.iso).toISOString().slice(0, 10);
      if (!map[day]) map[day] = { day, total: 0, count: 0, byMood: {} };
      map[day].total += e.score;
      map[day].count += 1;
      map[day].byMood[e.mood] = (map[day].byMood[e.mood] || 0) + 1;
    });
    return Object.values(map).sort((a, b) => (a.day < b.day ? -1 : 1));
  }, [entries]);

  // for chart scale
  const maxAvg = useMemo(() => {
    if (!daily.length) return 1;
    return Math.max(...daily.map((d) => d.total / d.count));
  }, [daily]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} role="dialog" aria-modal="true" aria-label="Analytics panel">
      <div style={styles.panel}>
        <header style={styles.header}>
          <h3 style={{ margin: 0, color: "#000" }}>Wellness Analytics</h3>
          <div style={styles.headerRight}>
            <button style={styles.smallBtn} onClick={() => window.print()}>
              Print
            </button>
            <button style={styles.closeBtn} onClick={onClose}>
              ✕
            </button>
          </div>
        </header>

        <div style={styles.content}>
          <section style={styles.section}>
            <h4 style={styles.sectionTitle}>Mood Over Time</h4>
            {loading ? (
              <div style={styles.center}>Loading chart…</div>
            ) : error ? (
              <div style={styles.center}>Error: {error}</div>
            ) : !daily.length ? (
              <div style={styles.center}>No data available</div>
            ) : (
              <BarChart daily={daily} maxAvg={maxAvg} />
            )}
            <Legend />
          </section>

          <section style={{ ...styles.section, marginTop: 16 }}>
            <h4 style={styles.sectionTitle}>Activity Timeline</h4>
            {loading ? (
              <div style={styles.center}>Loading timeline…</div>
            ) : !entries.length ? (
              <div style={styles.center}>No timeline events</div>
            ) : (
              <Timeline entries={entries} />
            )}
          </section>
        </div>

        <footer style={styles.footer}>
          <div style={{ fontSize: 12, color: "#222" }}>
            Showing {entries.length} events across {daily.length} days
          </div>
        </footer>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div style={styles.legend}>
      {Object.keys(MOOD_COLOR).map((m) => (
        <div key={m} style={styles.legendItem}>
          <span style={{ ...styles.legendSwatch, background: MOOD_COLOR[m] }} />
          <span style={{ textTransform: "capitalize" }}>{m}</span>
        </div>
      ))}
    </div>
  );
}

function BarChart({ daily, maxAvg }) {
  const width = 600;
  const height = 160;
  const padding = { top: 12, right: 12, bottom: 28, left: 32 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const barW = Math.max(12, innerW / daily.length - 8);

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={Math.max(width, daily.length * (barW + 8) + padding.left + padding.right)} height={height}>
        <g transform={`translate(${padding.left},${padding.top})`}>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = innerH - t * innerH;
            return <line key={t} x1={0} x2={innerW} y1={y} y2={y} stroke="#ddd" strokeWidth={1} />;
          })}

          {daily.map((d, i) => {
            const avg = d.total / d.count;
            const h = (avg / Math.max(maxAvg, 1)) * innerH;
            const x = i * (barW + 8) + 4;
            const y = innerH - h;
            const moods = Object.entries(d.byMood).sort((a, b) => b[1] - a[1]);
            const dominant = moods.length ? moods[0][0] : "neutral";
            const color = MOOD_COLOR[dominant] ?? "#9AA7FF";
            return (
              <g key={d.day}>
                <rect x={x} y={y} width={barW} height={Math.max(2, h)} fill={color} rx={4} />
                <text x={x + barW / 2} y={innerH + 14} fontSize={11} textAnchor="middle" fill="#111">
                  {formatDateShort(d.day)}
                </text>
              </g>
            );
          })}

          <g>
            <text x={-8} y={innerH} fontSize={11} textAnchor="end" fill="#222">
              0
            </text>
            <text x={-8} y={innerH * 0.5} fontSize={11} textAnchor="end" fill="#222">
              {Math.round((maxAvg / 2) * 10) / 10}
            </text>
            <text x={-8} y={4} fontSize={11} textAnchor="end" fill="#222">
              {Math.round(maxAvg * 10) / 10}
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}

function Timeline({ entries }) {
  const sorted = [...entries].sort((a, b) => (a.iso < b.iso ? 1 : -1));
  return (
    <div style={styles.timeline}>
      {sorted.map((e) => (
        <div key={e.id} style={styles.timelineItem}>
          <div style={styles.timeCol}>
            <div style={styles.timeText}>{new Date(e.iso).toLocaleString()}</div>
          </div>
          <div style={styles.dotCol}>
            <div style={{ ...styles.dot, background: MOOD_COLOR[e.mood] ?? "#9AA7FF" }} />
            <div style={styles.vertLine} />
          </div>
          <div style={styles.eventCol}>
            <div style={styles.eventHeader}>
              <strong style={{ textTransform: "capitalize" }}>{e.mood}</strong>
              <span style={styles.scoreBadge}>{e.score}</span>
            </div>
            <div style={styles.eventText}>{e.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(10,12,20,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1200,
    padding: 20,
  },
  panel: {
    width: "min(1000px, 96%)",
    maxHeight: "92vh",
    background: "#fff",
    borderRadius: 10,
    boxShadow: "0 8px 40px rgba(4,8,20,0.4)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    padding: "12px 16px",
    borderBottom: "1px solid #f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerRight: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  closeBtn: {
    border: "none",
    background: "transparent",
    fontSize: 18,
    cursor: "pointer",
    padding: 6,
    color: "#000",
  },
  smallBtn: {
    border: "1px solid #e0e0e0",
    background: "#fafafa",
    padding: "6px 10px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    color: "#000",
  },
  content: {
    padding: 16,
    overflow: "auto",
  },
  section: {
    background: "#fff",
    borderRadius: 8,
    padding: 12,
    boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.02)",
  },
  sectionTitle: {
    margin: "0 0 8px 0",
    fontSize: 14,
    color: "#222",
  },
  center: {
    padding: 18,
    textAlign: "center",
    color: "#222",
  },
  legend: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    marginTop: 10,
    flexWrap: "wrap",
  },
  legendItem: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    fontSize: 13,
    color: "#333",
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
    display: "inline-block",
  },
  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    paddingTop: 6,
  },
  timelineItem: {
    display: "grid",
    gridTemplateColumns: "180px 32px 1fr",
    gap: 12,
    alignItems: "start",
  },
  timeCol: {
    color: "#222",
    fontSize: 12,
  },
  timeText: {
    whiteSpace: "nowrap",
  },
  dotCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
  },
  vertLine: {
    width: 2,
    background: "#bbb",
    flex: 1,
    marginTop: 6,
    alignSelf: "stretch",
    height: "100%",
  },
  eventCol: {
    background: "#FBFBFF",
    border: "1px solid #f1f1ff",
    padding: 10,
    borderRadius: 8,
  },
  eventHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  scoreBadge: {
    background: "#fff",
    border: "1px solid #eee",
    padding: "2px 8px",
    borderRadius: 12,
    fontSize: 12,
    color: "#333",
  },
  eventText: {
    color: "#333",
    fontSize: 13,
  },
  footer: {
    padding: "10px 16px",
    borderTop: "1px solid #f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
};
