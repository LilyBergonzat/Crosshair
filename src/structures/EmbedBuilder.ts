import { EmbedBuilder as DiscordEmbedBuilder } from 'discord.js';
import type { EmbedData, APIEmbed } from 'discord.js';

export default class EmbedBuilder extends DiscordEmbedBuilder {
    constructor(error = false, data?: EmbedData | APIEmbed) {
        super(data);

        this.setColor(error ? 0xff2a2a : 0x2aff2a);
    }
}
