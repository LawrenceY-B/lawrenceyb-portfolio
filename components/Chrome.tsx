export function Loader() {
  return (
    <div id="loader" aria-hidden="true">
      <div className="log" id="log" />
      <div className="count" id="count">
        000<em>%</em>
      </div>
      <div className="rail">
        <i id="rail" />
      </div>
    </div>
  );
}

export function ParticleCanvas() {
  return <canvas id="gl" aria-hidden="true" />;
}

export function Cursor() {
  return (
    <div className="cur" id="me" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 26 26">
        <path
          d="M4.6 2.9C3.5 2.4 2.4 3.5 2.9 4.6L10.4 22.1C10.9 23.3 12.6 23.2 13 22C14 18.6 15.4 15.6 21.9 13.1C23.2 12.6 23.3 10.9 22.1 10.4Z"
          fill="var(--bg)"
          stroke="var(--ink)"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
      </svg>
      <span className="name gbtn" id="meName" />
    </div>
  );
}
