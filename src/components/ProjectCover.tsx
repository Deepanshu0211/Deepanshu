import styles from "./Portfolio.module.css";
function Star({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M50 0 57 36 85 15 64 43 100 50 64 57 85 85 57 64 50 100 43 64 15 85 36 57 0 50 36 43 15 15 43 36Z" fill="currentColor" /></svg>;
}

export default function ProjectCover({ type, immersive = false }: { type: string; immersive?: boolean }) {
  const copy = immersive ? { "data-immersive-copy": "" } : {};
  const cover = immersive ? { "data-immersive-cover": "" } : {};
  if (type === "impact") return <div className={`${styles.cover} ${styles.impact}`} {...cover}>
    <span className={styles.coverLabel}>IMPACTHUB / RESPONSE NETWORK</span>
    <svg viewBox="0 0 600 420" className={styles.contours} aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => <ellipse key={i} cx="310" cy="210" rx={45 + i * 21} ry={25 + i * 15} transform={`rotate(-27 310 210)`} />)}
      <path d="M140 310 270 220 335 135 445 170" strokeDasharray="4 6" />
      <circle cx="270" cy="220" r="7" /><circle cx="335" cy="135" r="7" /><circle cx="445" cy="170" r="7" />
    </svg>
    <strong {...copy}>Every second<br /><em>connects.</em></strong>
    <span className={styles.coverFoot} {...copy}>REAL-TIME COORDINATION <span>↗</span></span>
  </div>;
  if (type === "neatify") return <div className={`${styles.cover} ${styles.neatify}`} {...cover}>
    <span className={styles.coverLabel}>NEATIFY / A LITTLE LESS CHAOS</span>
    <div className={styles.neatifyCoverInner}>
      <img
        src="/mascot/neatify-mascot-folder.png"
        alt="Neatify mascot carrying folders"
        className={styles.mascotCoverImg}
      />
      <div className={styles.neatifyCoverBadge} {...copy}>
        <span>DESKTOP APP</span>
        <strong>LESS SEARCHING.<br />MORE DOING.</strong>
      </div>
    </div>
    <span className={styles.coverFoot} {...copy}>ORDER, WITHOUT THE EFFORT. <span>02</span></span>
  </div>;
  if (type === "gurukul") return <div className={`${styles.cover} ${styles.gurukul}`} {...cover}>
    <span className={styles.coverLabel}>GURUKUL / CONNECTED CAMPUS</span>
    <Star className={styles.campusStar} /><strong {...copy}>Here.<br /><em>Together.</em></strong>
    <span className={styles.coverFoot} {...copy}>ATTENDANCE & STUDENT SAFETY <span>03</span></span>
  </div>;
  return <div className={`${styles.cover} ${styles.demox}`} {...cover}>
    <span className={styles.coverLabel}>DEMOX / DESIGN IN MOTION</span>
    <div className={styles.demoxWord} aria-hidden="true">D<span>↗</span><br />MOX</div>
    <span className={styles.coverFoot} {...copy}>A DIFFERENT DIMENSION. <span>04</span></span>
  </div>;
}


