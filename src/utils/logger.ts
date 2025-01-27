type LogLevel = 'error' | 'warn' | 'info' | 'debug';

class Logger {
  private static instance: Logger;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }

  info(message: string, ...args: any[]): void {
    console.info(`[INFO] ${message}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
    console.debug(`[DEBUG] ${message}`, ...args);
  }
}

export const logger = Logger.getInstance();
