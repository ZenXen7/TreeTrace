declare module '@balkangraph/familytree.js' {
  export default class FamilyTree {
    constructor(element: HTMLElement, config?: any);
    
    static orientation: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    
    static layout: {
      normal: number;
      mixed: number;
      tree: number;
    };
    
    static anim: {
      outBack: any;
      inBack: any;
    };
    
    static match: {
      boundary: any;
    };
    
    static templates: {
      [key: string]: {
        [key: string]: any;
      };
    };
    
    static icon: {
      [key: string]: (...args: any[]) => any;
    };
    
    on(event: string, callback: (sender: any, args: any) => void): void;
    editUI: {
      on(event: string, callback: (sender: any, args: any) => void): void;
    };
    nodeCircleMenuUI: {
      on(event: string, callback: (sender: any, args: any) => void): void;
    };
    
    load(data: any[]): void;
    draw(): void;
    get(id?: any): any;
    add(data: any): void;
    update(data: any): void;
    remove(id: any): void;
    
    // Allow any additional properties for configuration
    [key: string]: any;
  }
}

// Global type augmentations
declare global {
  interface Node {
    style?: any;
  }
}