// This file serves as a catch-all for any missing type declarations
// Add any global custom types here

declare module 'custom' {
  const content: any;
  export default content;
}

// Add declarations for modules without official type definitions
declare module 'q' {
  export function defer<T>(): {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (reason: any) => void;
  };
}

declare module 'json5' {
  export function parse(text: string, reviver?: (key: any, value: any) => any): any;
  export function stringify(value: any, replacer?: (key: string, value: any) => any, space?: string | number): string;
}

declare module 'graceful-fs' {
  import * as fs from 'fs';
  export = fs;
}

declare module 'node-forge' {
  export const pki: any;
  export const md: any;
  export const util: any;
  export const random: any;
}

declare module 'serve-index' {
  import { RequestHandler } from 'express';
  function serveIndex(path: string, options?: any): RequestHandler;
  export = serveIndex;
}

declare module 'sockjs' {
  function createServer(options?: any): any;
  export = createServer;
}

declare module 'strip-bom' {
  function stripBom(string: string): string;
  export = stripBom;
}

declare module 'strip-json-comments' {
  function stripJsonComments(jsonString: string): string;
  export = stripJsonComments;
}

declare module 'html-minifier-terser' {
  export function minify(text: string, options?: any): string;
}

declare module 'trusted-types' {
  export function createPolicy(name: string, rules: any): any;
}
