import { InteractionContextType, MessageFlags } from 'discord.js';
import { Command } from '@sapphire/framework';
import { Subcommand, type SubcommandMappingArray } from '@sapphire/plugin-subcommands';

export default class extends Subcommand {
    public subcommandMappings: SubcommandMappingArray = [
        {
            type: 'method',
            name: 'list',
            chatInputRun: 'listSubcommand',
        },
        {
            type: 'method',
            name: 'add',
            chatInputRun: 'addSubcommand',
        },
        {
            type: 'method',
            name: 'remove',
            chatInputRun: 'removeSubcommand',
        },
    ];

    public async listSubcommand(interaction: Subcommand.ChatInputCommandInteraction<'cached'>): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const channelsData = await this.container.prisma.autoembedchannel.findMany({ where: {
            guildId: interaction.guildId!,
        } });

        const channels = channelsData ? channelsData.map(entity => `<#${entity.channelId}>`) : [];
        const areIs = channels.length > 1 ? 'are' : 'is';
        const plural = channels.length > 1 ? 's' : '';

        await interaction.editReply(
            channels.length < 1
                ? 'There are no auto-embed channels'
                : `There ${areIs} ${channels.length} auto-embed channel${plural}:\n\n> - ${channels.join('\n> - ')}`
        );
    }

    public async addSubcommand(interaction: Subcommand.ChatInputCommandInteraction<'cached'>): Promise<void> {
        const channelId = interaction.options.getChannel('channel', true).id;
        const existingChannel = await this.container.prisma.autoembedchannel.findUnique({ where: {
            guildId: interaction.guildId!,
            channelId,
        } });

        if (existingChannel) {
            await interaction.editReply(`❌ The channel <#${channelId}> is already an auto-embed channel`);

            return;
        }

        await this.container.prisma.autoembedchannel.create({ data: {
            channelId,
            guildId: interaction.guildId!,
        } });

        await interaction.editReply(`✅ The channel <#${channelId}> was successfully **added** as an auto-embed channel`);
    }

    public async removeSubcommand(interaction: Subcommand.ChatInputCommandInteraction<'cached'>): Promise<void> {
        const channelId = interaction.options.getChannel('channel', true).id;
        const existingChannel = await this.container.prisma.autoembedchannel.findUnique({ where: {
            guildId: interaction.guildId!,
            channelId,
        } });

        if (!existingChannel) {
            await interaction.editReply(`❌ The channel <#${channelId}> is currently not an auto-embed channel`);

            return;
        }

        await this.container.prisma.autoembedchannel.delete({ where: {
            channelId,
            guildId: interaction.guildId!,
        } });

        await interaction.editReply(`✅ The channel <#${channelId}> was successfully **removed** as an auto-embed channel`);
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand(command =>
            command
                .setName('autoembed')
                .setContexts(InteractionContextType.Guild)
                .setDefaultMemberPermissions(0)
                .setDescription('Allows you to configure auto-embed channels')
                .addSubcommand(subcommand => subcommand
                    .setName('list')
                    .setDescription('List existing auto-embed channels')
                )
                .addSubcommand(subcommand => subcommand
                    .setName('add')
                    .setDescription('Add an auto-embed channel')
                    .addChannelOption(option => option
                        .setName('channel')
                        .setDescription('The channel in which crosshair codes should automatically be embedded')
                        .setRequired(true)
                    )
                )
                .addSubcommand(subcommand => subcommand
                    .setName('remove')
                    .setDescription('Remove an auto-embed channel')
                    .addChannelOption(option => option
                        .setName('channel')
                        .setDescription('The channel in which crosshair codes should not be automatically embedded anymore')
                        .setRequired(true)
                    )
                )
        );
    }
}
