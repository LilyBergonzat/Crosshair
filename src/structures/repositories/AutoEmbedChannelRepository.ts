import EntityRepository from '#structures/EntityRepository';
import type { AutoEmbedChannel } from '#structures/entities/AutoEmbedChannel';
import { Collection } from 'discord.js';
import type { Snowflake } from 'discord.js';

export default class AutoEmbedChannelRepository extends EntityRepository<AutoEmbedChannel> {
    private autoEmbedChannels: Collection<Snowflake, Set<Snowflake>> = new Collection<Snowflake, Set<Snowflake>>();

    public async getGuildChannels(guildId: Snowflake): Promise<Set<Snowflake>> {
        if (!this.autoEmbedChannels.has(guildId)) {
            const guildAutoEmbedChannels = await this.find({ guildId });
            const channelIds = guildAutoEmbedChannels && guildAutoEmbedChannels.length > 0
                ? guildAutoEmbedChannels.map(channel => channel.channelId)
                : [];

            this.autoEmbedChannels.set(guildId, new Set(channelIds));
        }

        return this.autoEmbedChannels.get(guildId)!;
    }

    public async addChannel(guildId: Snowflake, channelId: Snowflake): Promise<void> {
        await this.nativeInsert({ guildId, channelId });

        if (!this.autoEmbedChannels.has(guildId)) {
            this.autoEmbedChannels.set(guildId, new Set());
        }

        this.autoEmbedChannels.get(guildId)!.add(channelId);
    }

    public async removeChannel(guildId: Snowflake, channelId: Snowflake): Promise<void> {
        await this.nativeDelete({ guildId, channelId });

        if (!this.autoEmbedChannels.has(guildId)) {
            return;
        }

        this.autoEmbedChannels.get(guildId)!.delete(channelId);
    }
}
