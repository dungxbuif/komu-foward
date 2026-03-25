import { MezonApi } from 'mezon-sdk/dist/cjs/api';
import * as tsproto from 'mezon-sdk/dist/cjs/api/api';
import { buildFetchOptions } from 'mezon-sdk/dist/cjs/utils';

/**
 * Extends MezonApi with listChannelMessages.
 * Exact same pattern as existing SDK methods (e.g. listClanDescs, createChannelDesc).
 */
export class ExtendedMezonApi extends MezonApi {
  /** Fetch channel message history */
  async listChannelMessages(
    bearerToken: string,
    clanId: string,
    channelId: string,
    messageId?: string,
    limit?: number,
    direction?: number,
    topicId?: string,
    options: any = {},
  ): Promise<tsproto.ChannelMessageList> {
    const urlPath = '/mezon.api.Mezon/ListChannelMessages';
    const queryParams = new Map();

    const encodedBody = tsproto.ListChannelMessagesRequest.encode(
      tsproto.ListChannelMessagesRequest.fromPartial({
        clan_id: clanId || '0',
        channel_id: channelId || '0',
        message_id: messageId || '0',
        limit: limit ?? 10,
        direction: direction ?? 0,
        topic_id: topicId || '0',
      }),
    ).finish();

    const fullUrl = this.buildFullUrl(this.basePath, urlPath, queryParams);
    const fetchOptions = buildFetchOptions('POST', options, '');
    fetchOptions.body = encodedBody;

    if (bearerToken) {
      fetchOptions.headers['Authorization'] = 'Bearer ' + bearerToken;
    }

    const res = await (this as any).rateLimitFetch(fullUrl, fetchOptions);

    // Handle HTTP errors before trying to decode protobuf
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`ListChannelMessages failed (HTTP ${res.status}): ${errorText}`);
    }

    return (this as any).handleResponse(res, {
      emptyAs: {},
      decode: (bytes: Uint8Array) => tsproto.ChannelMessageList.decode(bytes),
    });
  }
}
