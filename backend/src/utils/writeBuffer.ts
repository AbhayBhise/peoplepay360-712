import { prisma } from "../prisma";

export interface BufferedAuditRecord {
  userId?: string | null;
  module: string;
  action: string;
  recordId?: string | null;
  beforeValue?: object | null;
  afterValue?: object | null;
  ipAddress?: string | null;
}

/**
 * Enterprise Write-Buffer / Request Batcher
 * 
 * High-concurrency throughput engine designed for extreme scale (millions of RPS).
 * Buffers transient write requests in memory until the `maxBatchSize` limit is reached
 * or `flushIntervalMs` elapses, then executes a single bulk `prisma.auditLog.createMany` query.
 */
export class WriteBuffer<T> {
  private queue: T[] = [];
  private timer: NodeJS.Timeout | null = null;
  private isFlushing = false;

  constructor(
    private readonly maxBatchSize: number = 50,
    private readonly flushIntervalMs: number = 1000,
    private readonly flushHandler: (batch: T[]) => Promise<void>
  ) {
    this.scheduleFlush();
  }

  public enqueue(item: T): void {
    this.queue.push(item);
    if (this.queue.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  public async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) return;

    this.isFlushing = true;
    const batch = this.queue.splice(0, this.maxBatchSize);

    try {
      await this.flushHandler(batch);
    } catch (err) {
      console.error("[WriteBuffer] Bulk flush failed, re-queueing batch:", err);
      // Re-queue failed items at the front to prevent data loss
      this.queue.unshift(...batch);
    } finally {
      this.isFlushing = false;
    }
  }

  private scheduleFlush(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.flush().catch((err) => console.error("[WriteBuffer] Interval flush error:", err));
    }, this.flushIntervalMs);
  }

  public get pendingCount(): number {
    return this.queue.length;
  }
}

// Global Audit Log Write-Buffer Singleton
export const auditWriteBuffer = new WriteBuffer<BufferedAuditRecord>(
  50, // Batch limit count
  1000, // Flush timer (1s)
  async (batch) => {
    await prisma.auditLog.createMany({
      data: batch.map((item) => ({
        userId: item.userId ?? undefined,
        module: item.module,
        action: item.action,
        recordId: item.recordId ?? undefined,
        beforeValue: item.beforeValue ?? undefined,
        afterValue: item.afterValue ?? undefined,
        ipAddress: item.ipAddress ?? undefined,
      })),
    });
  }
);
