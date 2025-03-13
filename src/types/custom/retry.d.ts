declare module 'retry' {
  export function operation(options?: any): any;
  export function timeouts(options?: any): number[];
}