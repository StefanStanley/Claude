/**
 * PDF-Textextraktion – rein lokal, kein externer Dienst (on-prem-tauglich).
 *
 * Import bewusst über den lib-Pfad, damit die Debug-Harness von `pdf-parse`
 * (die beim Default-Import eine Testdatei liest) nicht ausgeführt wird.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export async function extractPdfText(buf: Buffer): Promise<string> {
  const data = await (pdfParse as (b: Buffer) => Promise<{ text: string }>)(buf);
  // Whitespace glätten: viele PDFs liefern harte Zeilenumbrüche mitten im Satz.
  return (data.text || "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
