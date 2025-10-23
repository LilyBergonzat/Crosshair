import { Guild } from 'discord.js';
import { Events } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener, ListenerOptions } from '@sapphire/framework';
import { GalleryManager } from '#structures/GalleryManager';

@ApplyOptions<ListenerOptions>({
    event: Events.GuildDelete,
})
export default class extends Listener {
    public async run(guild: Guild): Promise<void> {
        await this.container.prisma.autoEmbedChannel.deleteMany({ where: { guildId: guild.id } });

        const gallery = await GalleryManager.getRawGallery(guild.id);

        await this.container.prisma.gallery.delete({ where: { guildId: guild.id } });

        if (gallery) {
            await this.container.prisma.galleryEntry.deleteMany({ where: { channelId: gallery.channelId } });
        }
    }
}
