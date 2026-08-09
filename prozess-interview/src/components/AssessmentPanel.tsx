import { DIMENSION_LABELS, type Assessment } from "@/lib/ir/schema";

function scoreColor(score: number): string {
  if (score >= 70) return "var(--good)";
  if (score >= 45) return "var(--warn)";
  return "var(--risk)";
}

export default function AssessmentPanel({ assessment }: { assessment: Assessment }) {
  return (
    <section className="panel">
      <p className="eyebrow">Bewertung</p>
      <div className="score-big">
        <b style={{ color: scoreColor(assessment.overallScore) }}>{assessment.overallScore}</b>
        <span>/ 100 Gesamt-Reifegrad</span>
      </div>
      {assessment.summary && <p className="summary">{assessment.summary}</p>}

      <div>
        {assessment.dimensions.map((d) => (
          <div className="dim" key={d.key}>
            <div className="top">
              <span className="label">{DIMENSION_LABELS[d.key] ?? d.key}</span>
              <span className="num">{d.score}/100</span>
            </div>
            <div className="bar">
              <i style={{ width: `${d.score}%`, background: scoreColor(d.score) }} />
            </div>
            <ul>
              {d.findings.map((f, i) => (
                <li key={`f${i}`}>{f}</li>
              ))}
              {d.recommendations.map((r, i) => (
                <li className="rec" key={`r${i}`}>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {assessment.quickWins.length > 0 && (
        <>
          <p className="subhead">Quick Wins</p>
          <ul className="qwins">
            {assessment.quickWins.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
