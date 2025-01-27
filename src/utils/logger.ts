class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : arg
    ).join(' ');
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${formattedArgs}`;
  }

  info(message: string, ...args: any[]) {
    const formattedMessage = this.formatMessage('info', message, ...args);
    console.log(formattedMessage);
  }

  warn(message: string, ...args: any[]) {
    const formattedMessage = this.formatMessage('warn', message, ...args);
    console.warn(formattedMessage);
  }

  error(message: string, ...args: any[]) {
    const formattedMessage = this.formatMessage('error', message, ...args);
    console.error(formattedMessage);
  }

  debug(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage('debug', message, ...args);
      console.debug(formattedMessage);
    }
  }
}

export const logger = new Logger();
