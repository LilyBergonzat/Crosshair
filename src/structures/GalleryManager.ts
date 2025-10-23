import { container } from '@sapphire/framework';
import { Gallery } from '@prisma/client';
import { ForumChannel, Guild } from 'discord.js';

export class GalleryManager {
    public static async getRawGallery(guildId: string): Promise<Gallery | null> {
        return container.prisma.gallery.findUnique({ where: { guildId } });
    }

    public static async getGallery(guild: Guild): Promise<Gallery | null> {
        const gallery = await GalleryManager.getRawGallery(guild.id);
        const channel = gallery
            ? (await guild.channels.fetch(gallery.channelId).catch(() => null)) as ForumChannel | null
            : null;

        if (gallery && !channel) {
            await container.prisma.gallery.delete({ where: { guildId: guild.id } });
        }

        return gallery && channel ? gallery : null;
    }

    public static async getGalleryChannel(guild: Guild): Promise<ForumChannel | null> {
        const gallery = await GalleryManager.getGallery(guild);

        return gallery
            ? (await guild.channels.fetch(gallery.channelId).catch(() => null)) as ForumChannel | null
            : null;
    }
}