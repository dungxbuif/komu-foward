import { Logger, Module } from '@nestjs/common';
import { NezonModule, NezonUtilsService } from '@nezon';
import { MezonClient } from 'mezon-sdk';
import { ForwardingHandler } from './handler/forwarding.handler';
import { AppConfigService } from '../common/services/app-config.service';

@Module({
  imports: [
    NezonModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: async (configService: AppConfigService) => {
        return {
          token: configService.botConfig.token,
          botId: configService.botConfig.botId,
        };
      },
    }),
  ],
  providers: [ForwardingHandler, AppConfigService],
})
export class BotModule {
  private readonly logger = new Logger(BotModule.name);

  constructor(
    private readonly mezonClient: MezonClient,
    private readonly configService: AppConfigService,
    private readonly nezonUtils: NezonUtilsService,
  ) {
  }
}
