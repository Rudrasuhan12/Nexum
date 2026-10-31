import { prisma } from "../prisma.js";

export type JobHandler = (payload: any) => Promise<any>;

interface ClaimedJob {
  id: string;
  type: string;
  payload: any;
  status: string;
  attempts: number;
  runAt: Date;
}

export class BackgroundWorker {
  private handlers = new Map<string, JobHandler>();
  private timer: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private isRunning = false;
  private readonly maxAttempts: number;

  constructor(options?: { maxAttempts?: number }) {
    this.maxAttempts = options?.maxAttempts ?? 3;
  }

  /**
   * Register a handler function for a specific Job type.
   */
  public registerHandler(type: string, handler: JobHandler): void {
    this.handlers.set(type, handler);
  }

  /**
   * Atomically claim the next pending job using PostgreSQL row-level locking (SKIP LOCKED).
   * Safe across multiple concurrent worker instances or threads.
   */
  public async claimNextJob(): Promise<ClaimedJob | null> {
    const claimed = await prisma.$queryRaw<ClaimedJob[]>`
      WITH next_job AS (
        SELECT id
        FROM "Job"
        WHERE status = 'PENDING' AND "runAt" <= (NOW() + INTERVAL '2 seconds')
        ORDER BY "runAt" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE "Job"
      SET status = 'PROCESSING', "updatedAt" = NOW()
      FROM next_job
      WHERE "Job".id = next_job.id
      RETURNING "Job".id, "Job".type, "Job".payload, "Job".status, "Job".attempts, "Job"."runAt";
    `;

    return claimed.length > 0 ? claimed[0] : null;
  }

  /**
   * Recover jobs that were left in PROCESSING state after a crash or timeout.
   */
  public async recoverAbandonedJobs(timeoutMinutes: number = 5): Promise<number> {
    const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    // Re-queue abandoned jobs with remaining attempts
    const requeued = await prisma.$executeRaw`
      UPDATE "Job"
      SET status = 'PENDING',
          attempts = attempts + 1,
          "lastError" = 'Recovered from abandoned PROCESSING state (worker crash or timeout)',
          "updatedAt" = NOW()
      WHERE status = 'PROCESSING' AND "updatedAt" <= ${cutoff} AND attempts < ${this.maxAttempts}
    `;

    // Mark jobs as FAILED if max attempts exceeded
    await prisma.$executeRaw`
      UPDATE "Job"
      SET status = 'FAILED',
          "lastError" = 'Max retry attempts exceeded after worker abandonment',
          "updatedAt" = NOW()
      WHERE status = 'PROCESSING' AND "updatedAt" <= ${cutoff} AND attempts >= ${this.maxAttempts}
    `;

    return requeued;
  }

  /**
   * Execute a single claimed job with exponential backoff retry.
   */
  public async processJob(job: ClaimedJob): Promise<boolean> {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          lastError: `NO_HANDLER_REGISTERED: No handler found for job type '${job.type}'`,
          updatedAt: new Date(),
        },
      });
      return false;
    }

    try {
      const result = await handler(job.payload);

      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          result: (result as any) ?? {},
          updatedAt: new Date(),
        },
      });
      return true;
    } catch (err: any) {
      const currentAttempts = job.attempts + 1;
      const errorMessage = err?.message || String(err);

      if (currentAttempts < this.maxAttempts) {
        // Exponential backoff: 2^attempts * 2 seconds
        const backoffMs = Math.pow(2, currentAttempts) * 2000;
        const nextRunAt = new Date(Date.now() + backoffMs);

        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: "PENDING",
            attempts: currentAttempts,
            lastError: errorMessage,
            runAt: nextRunAt,
            updatedAt: new Date(),
          },
        });
      } else {
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            attempts: currentAttempts,
            lastError: errorMessage,
            updatedAt: new Date(),
          },
        });
      }
      return false;
    }
  }

  /**
   * Claim and execute one job immediately (useful for testing or tick).
   */
  public async runOnce(): Promise<boolean> {
    const job = await this.claimNextJob();
    if (!job) return false;
    return await this.processJob(job);
  }

  /**
   * Start background polling timer loop.
   */
  public start(intervalMs: number = 2000): void {
    if (this.isRunning) return;
    this.isRunning = true;

    const tick = async () => {
      if (!this.isRunning || this.isProcessing) return;
      this.isProcessing = true;
      try {
        await this.recoverAbandonedJobs();
        // Process jobs until queue is empty for current batch
        let job = await this.claimNextJob();
        while (job && this.isRunning) {
          await this.processJob(job);
          job = await this.claimNextJob();
        }
      } catch (err) {
        console.error("Background worker poll error:", err);
      } finally {
        this.isProcessing = false;
      }
    };

    this.timer = setInterval(tick, intervalMs);
    // Initial immediate tick
    void tick();
  }

  /**
   * Stop background polling timer loop.
   */
  public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

// Global default singleton background worker
export const backgroundWorker = new BackgroundWorker();
