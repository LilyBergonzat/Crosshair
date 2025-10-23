import { Subcommand, type SubcommandMappingArray } from '@sapphire/plugin-subcommands';
import { Command } from '@sapphire/framework';
import {
    MessageFlags,
    ChannelType,
    InteractionContextType,
    PermissionFlagsBits,
    ButtonStyle,
    ActionRowBuilder,
    ButtonBuilder,
    MessageComponentInteraction
} from 'discord.js';
import { GalleryManager } from '#root/structures/GalleryManager';
import { MessageActionRowComponentBuilder } from '@discordjs/builders';
import { MINUTE } from '#root/util/DateTime';

export default class extends Subcommand {
    public subcommandMappings: SubcommandMappingArray = [
        {
            type: 'group',
            name: 'gallery',
            entries: [
                {
                    type: 'method',
                    name: 'set-channel',
                    chatInputRun: 'gallerySetChannelSubcommand',
                },
                {
                    type: 'method',
                    name: 'unset-channel',
                    chatInputRun: 'galleryUnsetChannelSubcommand',
                },
            ],
        },
    ];

    public async gallerySetChannelSubcommand(interaction: Subcommand.ChatInputCommandInteraction<'cached'>): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const existingChannel = await GalleryManager.getGalleryChannel(interaction.guild!);

        if (existingChannel) {
            const setupCommand = interaction.client.application.commands.cache.find(command => command.name === 'setup');
            const unsetCommandMention = setupCommand ? `</setup gallery unset-channel:${setupCommand.id}>` : '`/setup gallery unset-channel`';

            await interaction.editReply(
                `❌ You cannot have more than one gallery per server. If you want to change the forum channel that serves as the gallery, you have to unlink the current one first by using ${unsetCommandMention}`
            );

            return;
        }

        const channel = interaction.options.getChannel('channel', true, [ChannelType.GuildForum]);
        const botMember = await interaction.guild.members.fetch(interaction.client.user.id).catch(error => {
            this.container.logger.error(`Could not get bot member for guild ${interaction.guild.name} (${interaction.guildId}):`, error);
        });

        if (!botMember) {
            await interaction.editReply(`❌ There was an error while trying to retrieve the permissions. Please try again later.`);

            return;
        }

        const permissions = channel.permissionsFor(botMember);
        const neededPermissions = PermissionFlagsBits.SendMessages
            & PermissionFlagsBits.SendMessagesInThreads
            & PermissionFlagsBits.ManageWebhooks;

        if (!permissions.has(neededPermissions)) {
            await interaction.editReply(`
                **❌ I do not have enough permissions to post in this channel.**
                
                Please make sure I have the permission to:
                - Create forum posts
                - Send messages in forum posts
                - Manage webhooks
            `.replace(/\n +/gu, '\n'));

            return;
        }

        const webhook = await channel.createWebhook({
            name: 'Crosshair',
            avatar: interaction.client.user.avatarURL({ size: 2048 }),
        }).catch(error => {
            this.container.logger.error(`There was an error during webhook creation in guild ${interaction.guild.name} (${interaction.guildId}) for channel ${channel.name} (${channel.id}):`, error);
        });

        if (!webhook) {
            await interaction.editReply(`❌ An unexpected error happened during the creation of the webhook. Please try again later.`);

            return;
        }

        await this.container.prisma.gallery.create({ data: {
            guildId: interaction.guildId!,
            channelId: channel.id,
            webhookId: webhook.id,
        } });

        await interaction.editReply(`✅ The channel ${channel} was correctly registered as the crosshair gallery channel for this server.`);
    }

    public async galleryUnsetChannelSubcommand(interaction: Subcommand.ChatInputCommandInteraction<'cached'>): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const existingChannel = await GalleryManager.getGalleryChannel(interaction.guild!);

        if (!existingChannel) {
            await interaction.editReply(`❌ There is currently no gallery channel setup on this server.`);

            return;
        }

        const buttonRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
            new ButtonBuilder().setCustomId('setup-gallery-unset-channel-no').setLabel('No').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('setup-gallery-unset-channel-yes').setLabel('Yes').setStyle(ButtonStyle.Danger)
        )

        const reply = await interaction.editReply({
            content: `
                # ⚠️ Warning!
                > If you unlink the current gallery channel, **every single crosshair post will be unlinked** as well.
                > This means even if you set it up again afterwards, this bot will have no knowledge of all the currently posted crosshairs and **will not be able to prevent duplicates anymore**.
                
                ## Only do this if you really wish to not use this forum channel as a crosshair gallery anymore at all, if you want to delete it, or if the channel already has no posts.
                
                This operation is **irreversible**.
                Proceed anyways?
            `.replace(/\n +/gu, '\n'),
            components: [buttonRow],
        });

        const answer = await new Promise(resolve => {
            const collector = reply.createMessageComponentCollector({ time: 10 * MINUTE });

            collector.on('collect', async (interaction: MessageComponentInteraction) => {
                if (!interaction.customId.startsWith('setup-gallery-unset-channel')) {
                    return;
                }

                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                await interaction.deleteReply();

                resolve(interaction.customId === 'setup-gallery-unset-channel-yes');
            });

            collector.on('end', () => {
                resolve(false);
            });
        });

        if (!answer) {
            await interaction.editReply({
                content: `❌ Action cancelled by the user.`,
                components: [],
            });

            return;
        }

        await this.container.prisma.gallery.delete({ where: { guildId: interaction.guildId! } });
        await this.container.prisma.galleryEntry.deleteMany({ where: { channelId: existingChannel.id } });

        await interaction.editReply({
            content: `✅ This server no longer has a channel that serves as a crosshair gallery.`,
            components: [],
        });
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand(command => command
            .setName('setup')
            .setContexts(InteractionContextType.Guild)
            .setDescription('Setup the Crosshair bot')
            .addSubcommandGroup(group => group
                .setName('gallery')
                .setDescription(`Manage this server's crosshair gallery`)
                .addSubcommand(subcommand => subcommand
                    .setName('set-channel')
                    .setDescription('Set a forum channel to be the gallery of crosshairs')
                    .addChannelOption(option => option
                        .setName('channel')
                        .setDescription(`The forum channel that should serve as the gallery`)
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildForum)
                    )
                )
                .addSubcommand(subcommand => subcommand
                    .setName('unset-channel')
                    .setDescription('Unlink the forum channel that serves as a crosshair gallery')
                )
            )
        );
    }
}
