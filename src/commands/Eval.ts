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

        const code = interaction.options.getString('code', true);
        const allShards = interaction.options.getBoolean('all-shards') ?? false;
        const specificShard = interaction.options.getInteger('shard');
        const currentShardId = interaction.client.shard?.ids[0] ?? 0;

        const embed = new EmbedBuilder()
            .setTitle('✅ Code executed')
            .addFields({
                name: 'Executed code',
                value: `\`\`\`js\n${code}\`\`\``,
            });

        try {
            let output;

            if (allShards) {
                // Execute on all shards
                const results = await interaction.client.shard!.broadcastEval((client, context) => {
                    try {
                        return { success: true, result: eval(context.code), shardId: client.shard?.ids[0] ?? 0 };
                    } catch (error) {
                        return { success: false, error: (error as Error).message, shardId: client.shard?.ids[0] ?? 0 };
                    }
                }, { context: { code } });

                // Format results from all shards
                output = results.map((result) => {
                    if (result.success) {
                        return `[Shard ${result.shardId}]: ${result.result}`;
                    } else {
                        return `[Shard ${result.shardId}] ❌: ${result.error}`;
                    }
                }).join('\n');

                embed.addFields({ name: 'Execution mode', value: '🌐 All shards' });
            } else if (specificShard !== null) {
                // Execute on specific shard
                const results = await interaction.client.shard!.broadcastEval((client, context) => {
                    const shardId = client.shard?.ids[0] ?? 0;
                    if (shardId !== context.targetShard) {
                        return null;
                    }

                    try {
                        return { success: true, result: eval(context.code), shardId };
                    } catch (error) {
                        return { success: false, error: (error as Error).message, shardId };
                    }
                }, { context: { code, targetShard: specificShard } });

                const result = results.find(r => r !== null);

                if (!result) {
                    embed.setTitle('❌ Shard not found');
                    output = `Shard ${specificShard} does not exist`;
                } else if (result.success) {
                    output = result.result;
                    embed.addFields({ name: 'Execution mode', value: `🎯 Shard ${specificShard}` });
                } else {
                    embed.setTitle('❌ Code crashed');
                    output = result.error;
                    embed.addFields({ name: 'Execution mode', value: `🎯 Shard ${specificShard}` });
                }
            } else {
                // Execute on current shard only (default)
                output = eval(code);
                embed.addFields({ name: 'Execution mode', value: `📍 Current shard (${currentShardId})` });
            }

            if (!output || output.toString().trim().length < 1) {
                output = '<empty>';
            }

            embed.addFields({ name: 'Result', value: output.toString().substring(0, 1000) });
        } catch (error) {
            Logger.exception(error as Error);
            embed.setTitle('❌ Code crashed');
            embed.addFields({
                name: 'Error',
                value: (error as Error).message.substring(0, 1000)
            });
        }

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
                    )
                    .addIntegerOption(builder => builder
                        .setName('shard')
                        .setDescription('Execute on a specific shard (by ID)')
                        .setRequired(false)
                    )
                    .addBooleanOption(builder => builder
                        .setName('all-shards')
                        .setDescription('Execute on all shards')
                        .setRequired(false)
                    ),
            { guildIds: [process.env.TEST_GUILD!] }
        );
    }
}
