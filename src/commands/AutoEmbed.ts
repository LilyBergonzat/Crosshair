import type { ChatInputCommandInteraction } from 'discord.js';
import Logger from '@lilywonhalf/pretty-logger';
import { Command } from '@sapphire/framework';
import InteractionUtil from '#root/util/InteractionUtil';

export default class extends Command {
    public override async chatInputRun(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply();

        switch (interaction.options.getSubcommand()) {
            case 'list':
                await this.runList(interaction).catch(Logger.exception);
                break;

            case 'add':
                await this.runAdd(interaction).catch(Logger.exception);
                break;

            case 'remove':
                await this.runRemove(interaction).catch(Logger.exception);
                break;
        }
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand(command =>
            command
                .setName('autoembed')
                .setDMPermission(false)
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

    private async runList(interaction: ChatInputCommandInteraction): Promise<void> {
        const channelsData = await this.container.prisma.autoembedchannel.findMany({ where: {
            guildId: interaction.guildId!,
        } });
        const channels = channelsData ? channelsData.map(entity => `<#${entity.channelId}>`) : [];
        const areIs = channels.length > 1 ? 'are' : 'is';
        const plural = channels.length > 1 ? 's' : '';

        await InteractionUtil.reply(
            interaction,
            {
                title: 'Auto-Embed Channels',
                description: channels.length < 1
                    ? 'There are no auto-embed channels'
                    : `There ${areIs} ${channels.length} auto-embed channel${plural}:\n\n${channels.join('\n')}`,
            }
        );
    }

    private async runAdd(interaction: ChatInputCommandInteraction): Promise<void> {
        const channelId = interaction.options.getChannel('channel', true).id;
        const existingChannel = await this.container.prisma.autoembedchannel.findUnique({ where: {
            guildId: interaction.guildId!,
            channelId,
        } });

        if (existingChannel) {
            await InteractionUtil.reply(
                interaction,
                {
                    title: 'New Auto-Embed Channel',
                    description: `The channel <#${channelId}> is already an auto-embed channel`,
                },
                true
            );

            return;
        }

        await this.container.prisma.autoembedchannel.create({ data: {
            channelId,
            guildId: interaction.guildId!,
        } });

        await InteractionUtil.reply(
            interaction,
            {
                title: 'New Auto-Embed Channel',
                description: `The channel <#${channelId}> was successfully **added** as an auto-embed channel`,
            }
        );
    }

    private async runRemove(interaction: ChatInputCommandInteraction): Promise<void> {
        const channelId = interaction.options.getChannel('channel', true).id;
        const existingChannel = await this.container.prisma.autoembedchannel.findUnique({ where: {
            guildId: interaction.guildId!,
            channelId,
        } });

        if (!existingChannel) {
            await InteractionUtil.reply(
                interaction,
                {
                    title: 'Remove Auto-Embed Channel',
                    description: `The channel <#${channelId}> is currently not an auto-embed channel`,
                },
                true
            );

            return;
        }

        await this.container.prisma.autoembedchannel.delete({ where: {
            channelId,
            guildId: interaction.guildId!,
        } });

        await InteractionUtil.reply(interaction, {
            title: 'Remove Auto-Embed Channel',
            description: `The channel <#${channelId}> was successfully **removed** as an auto-embed channel`,
        });
    }
}
