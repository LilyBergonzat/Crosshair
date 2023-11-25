import type { ChatInputCommandInteraction } from 'discord.js';
import { Command } from '@sapphire/framework';
import { testCode, generateImage } from '#root/util/CrosshairUtil';
import { AttachmentBuilder } from 'discord.js';

export default class extends Command {
    public override async chatInputRun(interaction: ChatInputCommandInteraction): Promise<void> {
        const code = interaction.options.getString('code', true);

        await interaction.deferReply({ ephemeral: true });

        if (!testCode(code)) {
            await interaction.editReply(`The code you sent is incorrect.`);

            return;
        }

        await interaction.editReply({ files: [new AttachmentBuilder(await generateImage(code))] });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand(
            command =>
                command
                    .setName('crosshair')
                    .setDescription('Get a preview of a crosshair code!')
                    .addStringOption(option => option
                        .setName('code')
                        .setDescription(`The code of the crosshair you want to preview`)
                        .setRequired(true)
                    )
        );
    }
}
