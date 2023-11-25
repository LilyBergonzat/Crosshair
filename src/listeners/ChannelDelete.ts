import type { DMChannel, GuildChannel } from 'discord.js';
import { Events } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener, ListenerOptions } from '@sapphire/framework';
import { UseRequestContext } from '#structures/UseRequestContext';

@ApplyOptions<ListenerOptions>({
    event: Events.ChannelDelete,
})
export default class extends Listener {
    @UseRequestContext()
    public async run(channel: DMChannel|GuildChannel): Promise<void> {
        if (!(channel as GuildChannel).guildId) {
            return;
        }

        const { id, guildId } = channel as GuildChannel;
        const { autoEmbedChannelRepository } = this.container.database;

        await autoEmbedChannelRepository.removeChannel(guildId, id);
    }
}
