// フロントエンド用のシンプルなロガーサービス

export interface LogData {
  [key: string]: any;
}

export interface OperationTracker {
  operation: string;
  startTime: number;
  input: LogData;
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

class LoggerService {
  private level: LogLevel = LogLevel.INFO;
  private isEnabled: boolean = true;

  constructor() {
    // 環境変数からロガーの設定を読み込み
    this.isEnabled = process.env.REACT_APP_VIBE_LOGGER_ENABLED === 'true';
    
    // 開発環境ではDEBUGレベル、本番環境ではINFOレベル
    this.level = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
  }

  debug(message: string, data?: LogData): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log('DEBUG', message, data);
    }
  }

  info(message: string, data?: LogData): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log('INFO', message, data);
    }
  }

  warn(message: string, data?: LogData): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log('WARN', message, data);
    }
  }

  error(message: string, data?: LogData): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.log('ERROR', message, data);
    }
  }

  fatal(message: string, data?: LogData): void {
    if (this.shouldLog(LogLevel.FATAL)) {
      this.log('FATAL', message, data);
    }
  }

  // ユーザーアクションのロギング
  logUserAction(action: string, element?: string, data?: LogData): void {
    this.info('ユーザーアクション', {
      action,
      element,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...data
    });
  }

  // API呼び出しのロギング
  logApiCall(method: string, url: string, data?: LogData): void {
    this.info('API呼び出し', {
      method,
      url,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  // 操作開始の記録
  startOperation(operation: string, input: LogData = {}): OperationTracker {
    const tracker: OperationTracker = {
      operation,
      startTime: Date.now(),
      input
    };

    this.info(`開始: ${operation}`, {
      operation_id: this.generateId(),
      input,
      timestamp: new Date().toISOString()
    });

    return tracker;
  }

  // 操作完了の記録
  completeOperation(tracker: OperationTracker, output: LogData = {}): void {
    const duration = Date.now() - tracker.startTime;
    
    this.info(`完了: ${tracker.operation}`, {
      duration: `${duration}ms`,
      input: tracker.input,
      output,
      timestamp: new Date().toISOString()
    });
  }

  // 操作エラーの記録
  errorOperation(tracker: OperationTracker, error: Error, resolution?: string): void {
    const duration = Date.now() - tracker.startTime;
    
    this.error(`エラー: ${tracker.operation}`, {
      error: error.message,
      error_type: error.name,
      duration: `${duration}ms`,
      resolution,
      input: tracker.input,
      timestamp: new Date().toISOString()
    });
  }

  private shouldLog(level: LogLevel): boolean {
    return this.isEnabled && level >= this.level;
  }

  private log(level: string, message: string, data?: LogData): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };

    // コンソールに出力
    switch (level) {
      case 'DEBUG':
        console.debug(`[${timestamp}] ${level}: ${message}`, data);
        break;
      case 'INFO':
        console.info(`[${timestamp}] ${level}: ${message}`, data);
        break;
      case 'WARN':
        console.warn(`[${timestamp}] ${level}: ${message}`, data);
        break;
      case 'ERROR':
      case 'FATAL':
        console.error(`[${timestamp}] ${level}: ${message}`, data);
        break;
    }

    // 将来的にはここで外部ロギングサービスに送信することも可能
    // this.sendToExternalLogger(logEntry);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// シングルトンインスタンス
export const logger = new LoggerService();