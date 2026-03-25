import { Injectable, Logger } from '@nestjs/common';
import { AutoContext, Nezon, On } from '@nezon';
import { Events } from 'mezon-sdk';
import { AppConfigService } from '../../common/services/app-config.service';
import { NezonUtilsService } from '../../libs/nezon/services/nezon-utils.service';
import { SmartMessage } from '../../libs/nezon/messaging/smart-message';

@Injectable()
export class ForwardingHandler {
  private readonly logger = new Logger(ForwardingHandler.name);

  constructor(
    private readonly configService: AppConfigService,
    private readonly nezonUtilsService: NezonUtilsService,
  ) {}

  @On(Events.ChannelMessage)
  async onMessage(@AutoContext() [managedMessage]: Nezon.AutoContext) {
    const message = managedMessage?.raw;

    if (!this.isValidIncomingMessage(message)) {
      return;
    }

    this.logIncomingMessage(message);

    const targetThreadId = this.determineTargetThread(message);
    if (!targetThreadId) {
      return;
    }

    if (!this.hasForwardableContent(message)) {
      return;
    }

    await this.executeForwardToThread(message, targetThreadId);
  }

  private isValidIncomingMessage(message: any): boolean {
    if (!message) {
      return false;
    }

    const botId = this.configService.botConfig.botId;
    if (message.sender_id === botId) {
      return false;
    }

    return true;
  }

  private logIncomingMessage(message: any): void {
    const content = this.extractMessageContent(message);
    const identifier = message.channel_id || message.topic_id || 'unknown';
    const senderName = message.display_name || message.username || 'Anonymous';
    this.logger.log(`📩 [Location: ${identifier}] ${senderName}: ${content || '(no text)'}`);
  }

  private determineTargetThread(message: any): string | undefined {
    const config = this.configService.threadConfig;
    const sourceId = config.sourceId;
    const destId = config.destId;

    if (!sourceId || !destId) {
      return undefined;
    }

    const isFromSource = message.channel_id === sourceId || message.topic_id === sourceId;
    const isFromDest = message.channel_id === destId || message.topic_id === destId;

    if (isFromSource) {
      return destId;
    }

    if (isFromDest) {
      return sourceId;
    }

    return undefined;
  }

  /**
   * Evaluates whether the message has any actual content to forward
   * (e.g., text content, embedded payload, or attachments).
   */
  private hasForwardableContent(message: any): boolean {
    const rawText = this.extractMessageContent(message);
    const attachments = message.attachments || [];
    const hasContentObject = message.content && Object.keys(message.content).length > 0;

    return Boolean(rawText || attachments.length > 0 || hasContentObject);
  }

  /**
   * Extracts text payload from the raw message structure.
   */
  private extractMessageContent(message: any): string {
    const payload = message?.content;
    
    if (!payload) return '';
    if (typeof payload === 'string') return payload;
    if (typeof payload.t === 'string') return payload.t;
    
    return '';
  }


  private async executeForwardToThread(message: any, targetThreadId: string): Promise<void> {
    this.logger.log(`🚀 Forwarding message to ${targetThreadId}...`);

    try {
      const prefixName = message.display_name || message.username || 'Datcom';
      const smartMessage = SmartMessage.fromForward(message, prefixName);
      
      const result = await this.nezonUtilsService.sendMessage(targetThreadId, smartMessage);
      if (result) {
        const payload = smartMessage.toJSON();
        this.logger.log(
          `✅ Forward successful (txt length: ${payload.content.t?.length}, attachments: ${payload.attachments?.length || 0})`
        );
      }
    } catch (err) {
      this.logger.error('Failed to forward message:', err);
    }
  }
}
