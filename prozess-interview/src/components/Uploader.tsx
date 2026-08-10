"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Belege hochladen (Audio, PDF, Foto, Text). Jede Datei geht an /api/ingest,
 * der extrahierte Klartext wird beschriftet ans Transkript gehängt. So speist
 * die multimodale Erfassung dieselbe Analyse-Pipeline wie das getippte/diktierte
 * Transkript.
 */
interface Props {
  onExtracted: (block: string) => void;
  disabled?: boolean;
}

type Status = "pending" | "done" | "error";
interface Row {
  id: string;
  name: string;
  status: Status;
  note?: string;
}

const ACCEPT = "audio/*,video/*,application/pdf,image/*,text/plain,.m4a,.md,.csv";

export default function Uploader({ onExtracted, disabled }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const seq = useRef(0);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      for (const file of list) {
        const id = `f${seq.current++}`;
        setRows((prev) => [...prev, { id, name: file.name, status: "pending" }]);
        try {
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/api/ingest", { method: "POST", body: fd });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || "Erfassung fehlgeschlagen.");
          if (typeof data.block === "string" && data.block.trim()) onExtracted(data.block);
          setRows((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status: "done", note: data.note } : r)),
          );
        } catch (err) {
          const note = err instanceof Error ? err.message : "Fehler.";
          setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "error", note } : r)));
        }
      }
    },
    [onExtracted],
  );

  return (
    <div className="uploader">
      <div
        className={`dropzone${dragOver ? " over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled && e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) inputRef.current?.click();
        }}
        aria-disabled={disabled}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 16V5m0 0-4 4m4-4 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <span>
          <b>Belege hinzufügen</b> — Audio, PDF, Foto ablegen oder auswählen
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {rows.length > 0 && (
        <ul className="ingest-list">
          {rows.map((r) => (
            <li key={r.id} className={`ingest-row ${r.status}`}>
              <span className={`ingest-dot ${r.status}`} aria-hidden="true" />
              <span className="ingest-name">{r.name}</span>
              <span className="ingest-note">
                {r.status === "pending" ? "wird verarbeitet …" : r.note}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
