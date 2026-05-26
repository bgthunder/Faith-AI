import "./Hero.css";

export default function Hero({ onEnter, onCommunity }) {
  return (
    <section className="hero-root" role="region" aria-label="Homepage hero">
      <div className="hero-decor" aria-hidden="true" />

      <header className="hero-topbar">
        <button className="hero-icon" aria-label="Brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.7)" strokeWidth="0.9" />
            <path d="M2 12h20M12 2v20" stroke="rgba(255,255,255,0.5)" strokeWidth="0.6" />
          </svg>
        </button>
        <button className="hero-menu" aria-label="Open community feed" onClick={() => onCommunity && onCommunity()}>
          Community
        </button>
      </header>

      <div className="hero-inner">
        <div className="hero-content">
          <h1 className="hero-title">FAITH
            <span className="hero-title-break">AI</span>
          </h1>
          <p className="hero-sub">Your AI Emotional Companion</p>

          <div className="hero-cta">
            <button
              className="hero-button"
              onClick={() => onEnter && onEnter()}
              aria-label="Open chat">
              Chat
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
