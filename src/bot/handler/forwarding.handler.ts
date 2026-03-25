import { Injectable, Logger } from '@nestjs/common';
import { AutoContext, Nezon, On } from '@nezon';
import { Events } from 'mezon-sdk';
import { NezonClientService } from '../../libs/nezon/client/nezon-client.service';
import { SmartMessage } from '../../libs/nezon/messaging/smart-message';
import { AppConfigService } from '../../common/services/app-config.service';

@Injectable()
export class ForwardingHandler {
  private readonly logger = new Logger(ForwardingHandler.name);

  constructor(
    private readonly configService: AppConfigService,
    private readonly nezonClientService: NezonClientService,
  ) {}

  @On(Events.ChannelMessage)
  async onMessage(@AutoContext() [managedMessage]: Nezon.AutoContext) {
    const message = managedMessage?.raw;
    if (!message) return;

    const content = this.extractMessageContent(message);
    this.logger.log(
      `📩 [Channel: ${message.channel_id} | Topic: ${message.topic_id || 'vô danh'}] ${message.display_name || message.username}: ${content || '(no text)'}`,
    );

    const sourceThreadId = this.configService.threadConfig.sourceId;
    const destThreadId = this.configService.threadConfig.destId;

    if (!sourceThreadId || !destThreadId) return;

    // Check if the source matches `channel_id` or `topic_id`
    if (message.channel_id === sourceThreadId || message.topic_id === sourceThreadId) {
      this.logger.log(`Received message from source thread ${sourceThreadId}, forwarding...`);

      const rawText = this.extractMessageContent(message);
      const attachments = message.attachments || [];
      
      if (!rawText && attachments.length === 0 && (!message.content || Object.keys(message.content).length === 0)) return;

      const client = this.nezonClientService.getClient() as any;

      try {
        const channel = await client.channels?.fetch?.(destThreadId);
        if (channel && typeof channel.send === 'function') {
          // Xây dựng lại message bằng tiện ích có sẵn của Nezon SmartMessage
          const prefixName = message.display_name || message.username || 'Datcom';
          const msg = SmartMessage.fromForward(message, prefixName).toJSON();

          // Hàm send: send(content, mentions, attachments, ...)
          await channel.send(msg.content, msg.mentions, msg.attachments);
          
          this.logger.log(`Forwarded full message to ${destThreadId} (txt length: ${msg.content.t?.length}, attachments: ${msg.attachments?.length || 0})`);
        } else {
          this.logger.error(`Destination channel ${destThreadId} not found or does not support send()`);
        }
      } catch (err) {
        this.logger.error('Failed to forward message:', err);
      }
    }
  }

  private extractMessageContent(message: any) {
    const payload = message?.content;
    if (!payload) return '';
    if (typeof payload === 'string') return payload;
    if (typeof payload.t === 'string') return payload.t;
    return '';
  }
}
