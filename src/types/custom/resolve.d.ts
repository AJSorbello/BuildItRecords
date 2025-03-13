declare module 'resolve' {
  function sync(id: string, opts?: any): string;
  function isCore(id: string): boolean;
  export { sync, isCore };
}