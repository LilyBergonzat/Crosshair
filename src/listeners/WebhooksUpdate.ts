import type { ForumChannel, MediaChannel, NewsChannel, StageChannel, TextChannel, VoiceChannel } from 'discord.js';
import { Events } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener, ListenerOptions } from '@sapphire/framework';
import { GalleryManager } from '#structures/GalleryManager';

type ChannelWithWebhook = TextChannel | NewsChannel | VoiceChannel | StageChannel | ForumChannel | MediaChannel;

@ApplyOptions<ListenerOptions>({
    event: Events.WebhooksUpdate,
})
export default class extends Listener {
    public async run(channel: ChannelWithWebhook): Promise<void> {
        const gallery = await GalleryManager.getGallery(channel.guild);

        if (!gallery || channel.id !== gallery.channelId) {
            return;
        }

        const webhooks = await channel.fetchWebhooks().catch(() => null);

        if (!webhooks || webhooks.has(gallery.webhookId)) {
            return;
        }

        this.container.logger.warn(`Webhook deleted from channel ${channel.name} (${channel.id}) in guild ${channel.guild.name} (${channel.guild.name}). Recreating...`);

        const newWebhook = await channel.createWebhook({
            name: 'Crosshair',
            avatar: channel.client.user.avatarURL({ size: 2048 }),
        }).catch(error => {
            this.container.logger.error(`Could not recreate webhook for channel ${channel.name} (${channel.id}) in guild ${channel.guild.name} (${channel.guild.name}):`, error);
        });

        if (!newWebhook) {
            return;
        }

        await this.container.prisma.gallery.update({
            where: { channelId: channel.id },
            data: { webhookId: newWebhook.id },
        });

        this.container.logger.info(`Webhook successfully recreated for channel ${channel.name} (${channel.id}) in guild ${channel.guild.name} (${channel.guild.name}).`);
    }
}
