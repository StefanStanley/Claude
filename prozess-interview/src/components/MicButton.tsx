"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sprach-Diktat über die Web Speech API (läuft im Browser, Chrome/Edge).
 * Erkannter Text wird über onAppend an das Eingabefeld gehängt.
 *
 * Hinweis: In Chrome läuft die Erkennung über einen Google-Cloud-Dienst — für
 * den echten On-Prem-/KRITIS-Betrieb ist stattdessen die serverseitige
 * Whisper-Transkription vorgesehen (austauschbar über ein Transkriptions-Gateway).
 */
interface Props {
  onAppend: (text: string) => void;
  disabled?: boolean;
}

export default function MicButton({ onAppend, disabled }: Props) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recRef = useRef<any>(null);

  // Callback in einer Ref halten, damit der Effekt stabil bleibt (Recognition nur einmal erzeugen).
  const onAppendRef = useRef(onAppend);
  useEffect(() => {
    onAppendRef.current = onAppend;
  }, [onAppend]);

  useEffect(() => {
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.lang = "de-DE";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interimText += res[0].transcript;
      }
      if (finalText.trim()) onAppendRef.current(finalText.trim());
      setInterim(interimText);
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
    };
    rec.onerror = () => {
      setListening(false);
      setInterim("");
    };

    recRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  function toggle() {
    const rec = recRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      try {
        rec.start();
        setListening(true);
      } catch {
        /* start() wirft, wenn bereits aktiv — ignorieren */
      }
    }
  }

  if (!supported) {
    return (
      <button
        type="button"
        className="ghost mic"
        disabled
        title="Sprach-Diktat wird in diesem Browser nicht unterstützt (Chrome oder Edge nutzen)."
      >
        <MicGlyph />
        Diktat n/a
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        className={`ghost mic${listening ? " rec" : ""}`}
        onClick={toggle}
        disabled={disabled}
        aria-pressed={listening}
        title={listening ? "Aufnahme stoppen" : "Diktat starten (Deutsch)"}
      >
        {listening ? <span className="rec-dot" aria-hidden="true" /> : <MicGlyph />}
        {listening ? "Aufnahme stoppen" : "Diktieren"}
      </button>
      {listening && interim && <span className="interim">{interim}</span>}
    </>
  );
}

/** Schlichtes, monochromes Mikrofon-Icon (erbt die Textfarbe). */
function MicGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="2.5" width="6" height="11.5" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 17.5V21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
