import type { DMChannel, GuildChannel } from 'discord.js';
import { Events } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener, ListenerOptions } from '@sapphire/framework';

@ApplyOptions<ListenerOptions>({
    event: Events.ChannelDelete,
})
export default class extends Listener {
    public async run(channel: DMChannel|GuildChannel): Promise<void> {
        if (!(channel as GuildChannel).guildId) {
            return;
        }

        const { id, guildId } = channel as GuildChannel;

        if (!id || !guildId) {
            return;
        }

        await this.container.prisma.autoEmbedChannel.delete({ where: { channelId: id, guildId } });
        await this.container.prisma.gallery.delete({ where: { channelId: id } });
        await this.container.prisma.galleryEntry.deleteMany({ where: { channelId: id } });
    }
}
