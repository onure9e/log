export interface ProcessorOptions {
  sensitiveKeys: string[];
}

export class LogProcessor {
  private sensitiveKeys: Set<string>;
  private hasSensitiveKeys: boolean;

  // Bilinen hassas veri kalıpları (Regex)
  private readonly patterns = [
    { name: 'Bearer Token', regex: /Bearer\s+[A-Za-z0-9\-\._~\+\/]+/gi },
    { name: 'Generic API Key', regex: /(key|api|token|secret|auth|pass|pwd)=[A-Za-z0-9\-\._~\+\/]+/gi },
    { name: 'Stripe Secret Key', regex: /sk_(live|test)_[0-9a-zA-Z]{24}/g },
    { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/g },
    { name: 'GitHub Token', regex: /gh[p|o|r|s|b|e]_[a-zA-Z0-9]{36}/g },
    { name: 'Credit Card', regex: /\b(?:\d[ -]*?){13,16}\b/g },
    { name: 'Email', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g } // Opsiyonel: KVKK/GDPR için
  ];

  constructor(options: ProcessorOptions) {
    this.sensitiveKeys = new Set(options.sensitiveKeys.map(k => k.toLowerCase()));
    this.hasSensitiveKeys = this.sensitiveKeys.size > 0;
  }

  public process(data: any): any {
    if (!data) return data;

    // String içerisindeki kalıpları temizle (Örn: "URL: ...?apiKey=123")
    if (typeof data === 'string') {
      return this.redactString(data);
    }

    if (typeof data !== 'object') return data;

    return this.fastCloneAndRedact(data, 0, new WeakSet());
  }

  private redactString(str: string): string {
    let redacted = str;
    for (const pattern of this.patterns) {
      redacted = redacted.replace(pattern.regex, (match) => {
        // Eğer eşleşme bir atama içeriyorsa (key=value), sadece value kısmını maskele
        if (match.includes('=')) {
          const parts = match.split('=');
          return `${parts[0]}=[REDACTED]`;
        }
        if (match.toLowerCase().startsWith('bearer')) {
          return 'Bearer [REDACTED]';
        }
        return `[REDACTED_${pattern.name.replace(/\s+/g, '_').toUpperCase()}]`;
      });
    }
    return redacted;
  }

  private fastCloneAndRedact(obj: any, depth: number, visited: WeakSet<any>): any {
    if (depth > 10) return '[DEPTH_LIMIT]';
    if (obj instanceof Error) return this.serializeError(obj);
    
    if (typeof obj === 'object' && obj !== null) {
      if (visited.has(obj)) return '[CIRCULAR]';
      visited.add(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(v => this.process(v)); // recursive string check
    }

    const result: any = {};
    const keys = Object.keys(obj);
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const val = obj[key];

      // 1. Anahtar ismine göre koruma
      if (this.sensitiveKeys.has(key.toLowerCase())) {
        result[key] = '[REDACTED]';
      } 
      // 2. Değerin tipine göre derinlemesine koruma
      else if (typeof val === 'string') {
        result[key] = this.redactString(val);
      }
      else if (val !== null && typeof val === 'object') {
        result[key] = this.fastCloneAndRedact(val, depth + 1, visited);
      } 
      else {
        result[key] = val;
      }
    }
    return result;
  }

  private serializeError(error: Error): any {
    const serialized: any = {
      message: this.redactString(error.message),
      name: error.name,
      stack: this.redactString(error.stack || '')
    };

    const propNames = Object.getOwnPropertyNames(error);
    for (let i = 0; i < propNames.length; i++) {
      const prop = propNames[i];
      if (prop !== 'message' && prop !== 'name' && prop !== 'stack') {
        const val = (error as any)[prop];
        serialized[prop] = typeof val === 'string' ? this.redactString(val) : val;
      }
    }
    return serialized;
  }
}