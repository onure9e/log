import { AsyncLocalStorage } from 'async_hooks';

export class ContextManager {
  private static instance: ContextManager;
  private storage: AsyncLocalStorage<Map<string, any>>;

  private constructor() {
    this.storage = new AsyncLocalStorage<Map<string, any>>();
  }

  public static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager();
    }
    return ContextManager.instance;
  }

  public runWithContext<T>(context: Record<string, any>, callback: () => T): T {
    const store = new Map<string, any>(Object.entries(context));
    return this.storage.run(store, callback);
  }

  public getContext(): Record<string, any> {
    const store = this.storage.getStore();
    return store ? Object.fromEntries(store) : {};
  }

  public set(key: string, value: any): void {
    const store = this.storage.getStore();
    if (store) {
      store.set(key, value);
    }
  }

  public get(key: string): any {
    const store = this.storage.getStore();
    return store?.get(key);
  }
}
