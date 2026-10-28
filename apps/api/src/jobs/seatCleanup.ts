import prisma from '../config/db';
import { SeatStatus } from '@prisma/client';

export class SeatCleanupJob {
  private intervalId: NodeJS.Timeout | null = null;
  private intervalMs = 60 * 1000; // run every 60 seconds

  public start() {
    if (this.intervalId) return;

    console.log('🔄 SeatCleanupJob initialized. Sweeping expired seat holds every 60s.');

    // Run immediately on boot
    this.sweepExpiredHolds();

    this.intervalId = setInterval(() => {
      this.sweepExpiredHolds();
    }, this.intervalMs);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ SeatCleanupJob stopped.');
    }
  }

  public async sweepExpiredHolds(): Promise<number> {
    try {
      const now = new Date();
      const expiredHolds = await prisma.seatHold.findMany({
        where: {
          expiresAt: { lt: now },
        },
        include: {
          items: true,
        },
      });

      if (expiredHolds.length === 0) return 0;

      let releasedSeatsCount = 0;

      for (const hold of expiredHolds) {
        await prisma.$transaction(async (tx) => {
          const seatIds = hold.items.map((i) => i.seatId);

          // Only revert seats that are currently HELD (do not touch already BOOKED ones)
          const updated = await tx.showSeat.updateMany({
            where: {
              showId: hold.showId,
              seatId: { in: seatIds },
              status: SeatStatus.HELD,
            },
            data: {
              status: SeatStatus.AVAILABLE,
            },
          });

          releasedSeatsCount += updated.count;

          // Delete hold items and hold
          await tx.seatHoldItem.deleteMany({ where: { seatHoldId: hold.id } });
          await tx.seatHold.delete({ where: { id: hold.id } });
        });
      }

      if (releasedSeatsCount > 0) {
        console.log(`🧹 [CLEANUP JOB] Released ${releasedSeatsCount} seats from ${expiredHolds.length} expired holds.`);
      }

      return releasedSeatsCount;
    } catch (error) {
      console.error('❌ [CLEANUP JOB ERROR] Error cleaning expired seat holds:', error);
      return 0;
    }
  }
}

export const seatCleanupJob = new SeatCleanupJob();
export default seatCleanupJob;
