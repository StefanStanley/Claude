import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProzessLupe — Prozessaufnahme per Interview",
  description:
    "Interview-Transkript in ein BPMN-Modell und eine Prozessbewertung verwandeln. On-Prem-fähig für den Energiesektor.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
