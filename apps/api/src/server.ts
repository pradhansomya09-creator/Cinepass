import { createApp } from './app';
import { config } from './config';
import prisma from './config/db';
import seatCleanupJob from './jobs/seatCleanup';

async function bootstrap() {
  try {
    // 1. Verify Database Connection
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL Database successfully.');

    // 2. Start Expired Seat Hold Sweeper Job
    seatCleanupJob.start();

    // 3. Initialize Express Server
    const app = createApp();

    const server = app.listen(config.port, () => {
      console.log(`\n🚀 CinePass Movie Ticket Booking API is running!`);
      console.log(`📡 URL: http://localhost:${config.port}`);
      console.log(`📚 OpenAPI / Swagger Docs: http://localhost:${config.port}/api/docs`);
      console.log(`🔒 Environment: ${config.nodeEnv}`);
      console.log(`💳 Payment Mode: ${config.razorpay.mockMode ? 'Sandbox / Mock Provider' : 'Razorpay Live'}\n`);
    });

    // Graceful Shutdown
    const handleShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      seatCleanupJob.stop();
      server.close(async () => {
        await prisma.$disconnect();
        console.log('👋 CinePass API shutdown complete.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start CinePass API Server:', error);
    process.exit(1);
  }
}

bootstrap();
