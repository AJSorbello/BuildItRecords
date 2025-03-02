declare module 'hono' {
  export class Hono {
    constructor();
    use(path: string, middleware: any): this;
    get(path: string, handler: (c: Context) => any): this;
    post(path: string, handler: (c: Context) => any): this;
    put(path: string, handler: (c: Context) => any): this;
    delete(path: string, handler: (c: Context) => any): this;
    fetch: (request: Request, env?: any, executionCtx?: any) => Promise<Response>;
  }

  export interface Context {
    req: Request;
    env: any;
    executionCtx: any;
    header: (name: string, value: string) => void;
    html: (html: string) => Response;
    json: (data: any) => Response;
    body: (body: any, options?: any) => Response;
    notFound: () => Response;
  }
}
