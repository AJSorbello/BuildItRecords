declare module 'tapable' {
  export class SyncHook {
    constructor(args?: string[]);
    tap(name: string, fn: Function): void;
    call(...args: any[]): any;
  }
  export class AsyncParallelHook {
    constructor(args?: string[]);
    tapAsync(name: string, fn: Function): void;
    tapPromise(name: string, fn: Function): void;
    callAsync(...args: any[]): any;
  }
}