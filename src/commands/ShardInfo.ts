import type { ChatInputCommandInteraction } from 'discord.js';
import { MessageFlags } from 'discord.js';
import { Command } from '@sapphire/framework';
import EmbedBuilder from '#structures/EmbedBuilder';

export default class extends Command {
    public override async chatInputRun(interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.user.id !== process.env.OWNER) {
            await interaction.reply(`❌ You do not have the right to execute this command.`);

            return;
        }

        const guildId = interaction.options.getString('guild-id', true);
        const totalShards = interaction.client.shard?.count ?? 1;

        // Calculate which shard this guild would be on
        // Discord.js uses: (BigInt(guildId) >> 22n) % BigInt(totalShards)
        const shardId = Number((BigInt(guildId) >> 22n) % BigInt(totalShards));

        const embed = new EmbedBuilder()
            .setTitle('🔍 Shard Information')
            .addFields(
                { name: 'Guild ID', value: guildId, inline: true },
                { name: 'Shard ID', value: shardId.toString(), inline: true },
                { name: 'Total Shards', value: totalShards.toString(), inline: true }
            );

        // Try to get guild info from that shard if available
        try {
            const guildInfo = await interaction.client.shard!.broadcastEval((client, context) => {
                const shardId = client.shard?.ids[0] ?? 0;
                if (shardId !== context.targetShard) {
                    return null;
                }

                const guild = client.guilds.cache.get(context.guildId);
                if (!guild) {
                    return { found: false };
                }

                return {
                    found: true,
                    name: guild.name,
                    memberCount: guild.memberCount,
                    shardGuilds: client.guilds.cache.size
                };
            }, { context: { targetShard: shardId, guildId } });

            const result = guildInfo.find(r => r !== null);

            if (result?.found && result.name && result.memberCount !== undefined && result.shardGuilds !== undefined) {
                embed.addFields(
                    { name: 'Guild Name', value: result.name, inline: false },
                    { name: 'Members', value: result.memberCount.toString(), inline: true },
                    { name: 'Guilds on Shard', value: result.shardGuilds.toString(), inline: true }
                );
                embed.setColor(0x00ff00);
            } else {
                embed.addFields({ name: 'Status', value: '⚠️ Guild not found on calculated shard' });
                embed.setColor(0xffaa00);
            }
        } catch (error) {
            embed.addFields({ name: 'Status', value: '⚠️ Could not fetch guild information' });
            embed.setColor(0xffaa00);
        }

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand(
            command =>
                command
                    .setName('shard-info')
                    .setDefaultMemberPermissions(0)
                    .setDescription(`Get shard information for a guild ID`)
                    .addStringOption(builder => builder
                        .setName('guild-id')
                        .setDescription('The guild ID to check')
                        .setRequired(true)
                    ),
            { guildIds: [process.env.TEST_GUILD!] }
        );
    }
}
