const isDevelopment = process.env.NODE_ENV === 'development';

class Logger {
  info(message: string, ...args: any[]) {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    console.error(`[ERROR] ${message}`, ...args);
  }

  debug(message: string, ...args: any[]) {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}

export const logger = new Logger();
