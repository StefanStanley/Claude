// bpmn-js und bpmn-auto-layout liefern keine eigenen TypeScript-Typen.
declare module "bpmn-js/lib/NavigatedViewer" {
  const NavigatedViewer: new (options: { container: HTMLElement }) => any;
  export default NavigatedViewer;
}

declare module "bpmn-auto-layout" {
  export function layoutProcess(xml: string): Promise<string>;
}

declare module "*.css";
