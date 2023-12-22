import { Guild } from 'discord.js';
import { Events } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener, ListenerOptions } from '@sapphire/framework';
import { UseRequestContext } from '#structures/UseRequestContext';

@ApplyOptions<ListenerOptions>({
    event: Events.GuildDelete,
})
export default class extends Listener {
    @UseRequestContext()
    public async run(guild: Guild): Promise<void> {
        const { id } = guild;
        const { autoEmbedChannelRepository } = this.container.database;

        await autoEmbedChannelRepository.removeGuildChannels(id);
    }
}
