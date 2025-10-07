import { Guild } from 'discord.js';
import { Events } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener, ListenerOptions } from '@sapphire/framework';

@ApplyOptions<ListenerOptions>({
    event: Events.GuildDelete,
})
export default class extends Listener {
    public async run(guild: Guild): Promise<void> {
        await this.container.prisma.autoembedchannel.deleteMany({ where: { guildId: guild.id } });
    }
}
