import type { ChatInputCommandInteraction } from 'discord.js';
import { MessageFlags } from 'discord.js';
import Logger from '@lilywonhalf/pretty-logger';
import { Command } from '@sapphire/framework';
import EmbedBuilder from '#structures/EmbedBuilder';

export default class extends Command {
    public override async chatInputRun(interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.user.id !== process.env.OWNER) {
            await interaction.reply(`❌ You do not have the right to execute this command.`);

            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        let output;
        const embed = new EmbedBuilder()
            .setTitle('✅ Code executed')
            .addFields({
                name: 'Executed code',
                value: `\`\`\`js\n${interaction.options.getString('code')}\`\`\``,
            });

        try {
            output = eval(interaction.options.getString('code', true));
        } catch (error) {
            Logger.exception(error as Error);
            output = (error as Error).message;
            embed.setTitle('❌ Code crashed');
        }

        if (!output || output.toString().trim().length < 1) {
            output = '<empty>';
        }

        embed.addFields({ name: 'Result', value: output.toString() });

        await interaction.editReply({ embeds: [embed] });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand(
            command =>
                command
                    .setName('eval')
                    .setDefaultMemberPermissions(0)
                    .setDescription(`Allows you to execute nodejs code and display the return value`)
                    .addStringOption(builder => builder
                        .setName('code')
                        .setDescription('The nodejs code you want to execute')
                        .setRequired(true)
                    ),
            { guildIds: [process.env.TEST_GUILD!] }
        );
    }
}
