import { AttachmentBuilder, Collection, Snowflake } from 'discord.js';
import type { GuildTextBasedChannel, Message } from 'discord.js';
import { container } from '@sapphire/framework';
import { generateImage, getCode, testCode } from '#root/util/CrosshairUtil';
import { MINUTE } from '#root/util/DateTime';

export default class CrosshairCodeManager {
    private static instance: CrosshairCodeManager;

    private embeddedCodes: Collection<Snowflake, Set<string>> = new Collection<Snowflake, Set<string>>();

    public constructor() {
        if (CrosshairCodeManager.instance) {
            return CrosshairCodeManager.instance;
        }

        CrosshairCodeManager.instance = this;
    }

    public async handleMessageCreate(message: Message): Promise<void> {
        if (!message.guildId) {
            return;
        }

        const autoEmbedChannels = await container.prisma.autoembedchannel.findMany({ where: {
            guildId: message.guildId,
        } });

        if (!message.channel.isTextBased() || !autoEmbedChannels || autoEmbedChannels.length < 1) {
            return;
        }

        const autoEmbedChannelIds = autoEmbedChannels.map(entity => entity.channelId);
        const channel = message.channel as GuildTextBasedChannel;
        const isChannelAutoEmbed = autoEmbedChannelIds.includes(message.channelId);
        const isParentAutoEmbed = !!channel.parentId && autoEmbedChannelIds.includes(channel.parentId);
        const hasGrandParent = !!channel.parentId && !!channel.parent && !!channel.parent.parentId;
        const isGrandParentAutoEmbed = hasGrandParent && autoEmbedChannelIds.includes(channel.parent.parentId!);
        const code = getCode(message.content);

        if (!isChannelAutoEmbed && !isParentAutoEmbed && !isGrandParentAutoEmbed || !code || !testCode(code)) {
            return;
        }

        if (this.embeddedCodes.get(message.channelId)?.has(code)) {
            await message.react(`🟰`).catch(() => null);

            return;
        }

        if (!this.embeddedCodes.has(message.channelId)) {
            this.embeddedCodes.set(message.channelId, new Set<string>());
        }

        await message.reply({ files: [new AttachmentBuilder(
            await generateImage(code),
            { name: 'crosshair.png', description: 'Crosshair code preview' }
        )] }).catch(() => null);
        this.embeddedCodes.get(message.channelId)!.add(code);

        setTimeout(() => {
            this.embeddedCodes.get(message.channelId)!.delete(code);
        }, 5 * MINUTE);
    }
}
