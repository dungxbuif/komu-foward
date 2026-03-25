import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  private get(key: string): string {
    const value = this.configService.get<string>(key);

    if (value === undefined || value === null) {
      throw new Error(`${key} environment variable is not set`);
    }

    return value;
  }

  private getString(key: string): string {
    const value = this.get(key);
    return value.replaceAll('\\n', '\n');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get nodeEnv(): string {
    const value = this.configService.get<string>('NODE_ENV');
    return value || 'development';
  }

  get botConfig(): { botId: string; token: string } {
    return {
      botId: this.getString('MEZON_BOT_ID'),
      token: this.getString('MEZON_BOT_TOKEN'),
    };
  }

  get databaseUrl(): string {
    return this.getString('DATABASE_URL');
  }

  get threadConfig(): { sourceId: string; destId: string } {
    return {
      sourceId: this.getString('SOURCE_THREAD_ID'),
      destId: this.getString('DESTINATION_THREAD_ID'),
    };
  }
}
