// bpmn-js und bpmn-auto-layout liefern keine eigenen TypeScript-Typen.
declare module "bpmn-js/lib/NavigatedViewer" {
  const NavigatedViewer: new (options: { container: HTMLElement }) => any;
  export default NavigatedViewer;
}

declare module "bpmn-auto-layout" {
  export function layoutProcess(xml: string): Promise<string>;
}

// pdf-parse liefert keine Typen; Import über den lib-Pfad umgeht die Debug-Harness.
declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfParseResult {
    text: string;
    numpages: number;
    info: unknown;
  }
  function pdfParse(dataBuffer: Buffer): Promise<PdfParseResult>;
  export default pdfParse;
}

declare module "*.css";
