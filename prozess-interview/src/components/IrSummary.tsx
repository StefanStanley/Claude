import type { ProcessIr } from "@/lib/ir/schema";

export default function IrSummary({ ir }: { ir: ProcessIr }) {
  const taskCount = ir.elements.filter((e) => e.type.endsWith("Task")).length;
  const gatewayCount = ir.elements.filter((e) => e.type.endsWith("Gateway")).length;

  return (
    <section className="panel">
      <p className="eyebrow">Process IR — extrahierte Struktur</p>
      <h2>{ir.name}</h2>
      {ir.description && <p className="hint">{ir.description}</p>}

      <div className="meta-grid">
        <div className="stat">
          <b>{taskCount}</b>
          <span>Aktivitäten</span>
        </div>
        <div className="stat">
          <b>{gatewayCount}</b>
          <span>Entscheidungen</span>
        </div>
        <div className="stat">
          <b>{ir.systems.length}</b>
          <span>Systeme</span>
        </div>
      </div>

      {ir.roles.length > 0 && (
        <>
          <p className="subhead">Rollen</p>
          <div className="chips">
            {ir.roles.map((r) => (
              <span className="chip" key={r.id}>
                {r.name}
              </span>
            ))}
          </div>
        </>
      )}

      {ir.systems.length > 0 && (
        <>
          <p className="subhead">Systeme</p>
          <div className="chips">
            {ir.systems.map((s) => (
              <span className="chip" key={s.id}>
                <b>▪</b> {s.name}
              </span>
            ))}
          </div>
        </>
      )}

      {ir.openQuestions.length > 0 && (
        <>
          <p className="subhead">Offene Fragen der KI</p>
          <ul className="q-list">
            {ir.openQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
