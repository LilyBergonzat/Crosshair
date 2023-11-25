import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import AutoEmbedChannelRepository from '#structures/repositories/AutoEmbedChannelRepository';

@Entity({ customRepository: () => AutoEmbedChannelRepository })
export class AutoEmbedChannel {
    @PrimaryKey({ comment: 'The channel snowflake' })
    channelId!: string;

    @Property({ comment: 'The guild snowflake' })
    guildId!: string;
}
