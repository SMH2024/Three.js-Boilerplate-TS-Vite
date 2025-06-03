declare module 'lil-gui' {
  export class GUI {
    constructor();
    add(object: any, property: string, min?: number, max?: number, step?: number): any;
    addFolder(name: string): GUI;
    open(): GUI;
    close(): GUI;
  }
}
