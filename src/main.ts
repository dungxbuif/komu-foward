import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  app.enableShutdownHooks();
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGUSR2'];
  for (const signal of signals) {
    process.on(signal, async () => {
      try {
        await app.close();
      } catch (e) {
        console.error('Lỗi khi close app', e);
      } finally {
        process.exit(0);
      }
    });
  }

  await app.init();
  console.log('Bot is running continuously in background mode without HTTP server...');
}
bootstrap();
