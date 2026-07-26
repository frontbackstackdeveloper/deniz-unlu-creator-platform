import type { CSSProperties } from "react";

export function GiveawayWheel({
  current,
  target,
  completed,
}: {
  current: number;
  target: number;
  completed: boolean;
}) {
  const safeTarget = Math.max(1, target);
  const safeCurrent = Math.min(Math.max(0, current), safeTarget);
  const fillAngle = (safeCurrent / safeTarget) * 360;
  const segmentAngle = 360 / safeTarget;
  const wheelStyle = {
    "--wheel-fill": `${fillAngle}deg`,
    "--wheel-segment-end": `${Math.max(0.7, segmentAngle - 1.15)}deg`,
    "--wheel-segment-size": `${segmentAngle}deg`,
  } as CSSProperties;

  return (
    <div
      className={`giveaway-wheel-stage${completed ? " is-completed" : ""}`}
      aria-label={`${safeCurrent} / ${safeTarget} çekiliş katılımcısı`}
    >
      <span className="giveaway-wheel-pointer" aria-hidden="true" />
      <div className="giveaway-wheel" style={wheelStyle} aria-hidden="true">
        <span className="giveaway-wheel__disc" />
        <span className="giveaway-wheel__orbit giveaway-wheel__orbit--one" />
        <span className="giveaway-wheel__orbit giveaway-wheel__orbit--two" />
      </div>
      <div className="giveaway-wheel__hub">
        <strong>{safeCurrent}</strong>
        <span>/ {safeTarget}</span>
        <small>{completed ? "SONUÇLANDI" : "KATILIM"}</small>
      </div>
      <p>
        {completed
          ? "Çark tamamlandı ve kazanan belirlendi."
          : `${Math.max(0, safeTarget - safeCurrent)} kişilik yer kaldı.`}
      </p>
    </div>
  );
}
