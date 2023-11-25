import { AttachmentBuilder, Collection, Snowflake } from 'discord.js';
import type { GuildTextBasedChannel, Message } from 'discord.js';
import { container } from '@sapphire/framework';
import { generateImage, getCode, testCode } from '#root/util/CrosshairUtil';
import { UseRequestContext } from '#structures/UseRequestContext';
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

    @UseRequestContext()
    public async handleMessageCreate(message: Message): Promise<void> {
        if (!message.guildId) {
            return;
        }

        const { autoEmbedChannelRepository } = container.database;
        const autoEmbedChannels = await autoEmbedChannelRepository.getGuildChannels(message.guildId);

        if (!message.channel.isTextBased()) {
            return;
        }

        const channel = message.channel as GuildTextBasedChannel;
        const isChannelAutoEmbed = autoEmbedChannels.has(message.channelId);
        const isParentAutoEmbed = !!channel.parentId && autoEmbedChannels.has(channel.parentId);
        const code = getCode(message.content);

        if (!isChannelAutoEmbed && !isParentAutoEmbed || !code || !testCode(code)) {
            return;
        }

        if (this.embeddedCodes.get(message.channelId)?.has(code)) {
            await message.react(`🟰`);

            return;
        }

        if (!this.embeddedCodes.has(message.channelId)) {
            this.embeddedCodes.set(message.channelId, new Set<string>());
        }

        await message.reply({ files: [new AttachmentBuilder(await generateImage(code))] });
        this.embeddedCodes.get(message.channelId)!.add(code);

        setTimeout(() => {
            this.embeddedCodes.get(message.channelId)!.delete(code);
        }, 5 * MINUTE);
    }
}
