// Design Ref: §1.1 — Performance optimization via object pooling

export class ObjectPool<T> {
  private readonly pool: T[] = [];
  private readonly create: () => T;
  private readonly reset: (item: T) => void;

  constructor(create: () => T, reset: (item: T) => void, initialSize = 0) {
    this.create = create;
    this.reset = reset;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.create());
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.create();
  }

  release(item: T): void {
    this.reset(item);
    this.pool.push(item);
  }

  get size(): number {
    return this.pool.length;
  }
}
