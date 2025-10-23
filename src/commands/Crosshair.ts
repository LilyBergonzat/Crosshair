import { Subcommand, type SubcommandMappingArray } from '@sapphire/plugin-subcommands';
import { Command } from '@sapphire/framework';
import {
    AttachmentBuilder,
    LabelBuilder,
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import { testCode, generateImage, codeToHash, isCodeADSDifferent } from '#root/util/CrosshairUtil';
import { MINUTE } from '#root/util/DateTime';
import { GalleryManager } from '#root/structures/GalleryManager';

export default class extends Subcommand {
    public subcommandMappings: SubcommandMappingArray = [
        {
            type: 'method',
            name: 'view',
            chatInputRun: 'viewSubcommand',
        },
        {
            type: 'method',
            name: 'publish',
            chatInputRun: 'publishSubcommand',
        },
    ];

    public async viewSubcommand(interaction: Subcommand.ChatInputCommandInteraction<'cached'>): Promise<void> {
        const code = interaction.options.getString('code', true);
        const getAds = interaction.options.getBoolean('view-ads', false) ?? false;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!testCode(code)) {
            await interaction.editReply(`❌ The code you sent is incorrect.`);

            return;
        }

        await interaction.editReply({ files: [new AttachmentBuilder(
            await generateImage(code, getAds),
            { name: 'crosshair.png', description: 'Crosshair code preview' }
        )] });
    }

    public async publishSubcommand(interaction: Subcommand.ChatInputCommandInteraction<'cached'>): Promise<void> {
        const code = interaction.options.getString('code', true);

        if (!testCode(code)) {
            await interaction.reply({ content: `❌ The code you sent is incorrect.`, flags: MessageFlags.Ephemeral });

            return;
        }

        const gallery = await GalleryManager.getGallery(interaction.guild!);
        const channel = await GalleryManager.getGalleryChannel(interaction.guild!);

        if (!gallery || !channel) {
            await interaction.reply({
                content: `❌ This server does not yet have a crosshair gallery.`,
                flags: MessageFlags.Ephemeral,
            });

            return;
        }

        const hash = codeToHash(code);
        const existingEntry = await this.container.prisma.galleryEntry.findUnique({ where: {
            channelId_hash: { channelId: channel.id, hash },
        } });

        if (existingEntry) {
            const entryLink = `https://discord.com/channels/${channel.guildId}/${channel.id}/${existingEntry.postId}`;

            await interaction.reply({
                content: `❌ This code was already posted in the gallery: ${entryLink}.`,
                flags: MessageFlags.Ephemeral,
            });

            return;
        }

        const files = [new AttachmentBuilder(
            await generateImage(code),
            { name: 'crosshair.png', description: 'Crosshair code preview' }
        )];

        if (isCodeADSDifferent(code)) {
            files.push(new AttachmentBuilder(
                await generateImage(code, true),
                { name: 'crosshair-ads.png', description: 'Crosshair code preview with ADS' }
            ));
        }

        const modal = new ModalBuilder().setCustomId('crosshair-publish').setTitle('Publish a Crosshair Code');
        const name = new TextInputBuilder()
            .setCustomId('crosshair-publish-name')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('High-Precision Crosshair')
            .setRequired(true);
        const nameLabel = new LabelBuilder()
            .setLabel('Crosshair name')
            .setDescription(`Give a cool name to your crosshair so that it's easy to find in the list`)
            .setTextInputComponent(name);
        const description = new TextInputBuilder()
            .setCustomId('crosshair-publish-description')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('I found this crosshair on a random website. It helps a lot with the precision of my headshots!')
            .setRequired(true);
        const descriptionLabel = new LabelBuilder()
            .setLabel('Crosshair description')
            .setDescription(`Does this crosshair have a story? Tell us about it!`)
            .setTextInputComponent(description);

        modal.addLabelComponents(nameLabel, descriptionLabel);

        await interaction.showModal(modal);

        const modalInteraction = await interaction.awaitModalSubmit({ time: 10 * MINUTE }).catch(() => null);

        if (!modalInteraction) {
            await interaction.reply({ content: `❌ Publish cancelled by user.`, flags: MessageFlags.Ephemeral });

            return;
        }

        await modalInteraction.deferReply({ flags: MessageFlags.Ephemeral });

        const webhooks = await channel.fetchWebhooks();
        const webhook = webhooks?.get(gallery.webhookId);

        if (!webhook) {
            await modalInteraction.editReply(`❌ Unable to add a post to the gallery.\n-# The webhook could not be found. An admin can fix this.`);

            return;
        }

        const post = await webhook.send({
            username: interaction.member.displayName,
            avatarURL: interaction.member.displayAvatarURL({ size: 2048 }),
            threadName: modalInteraction.fields.getTextInputValue('crosshair-publish-name'),
            content: modalInteraction.fields.getTextInputValue('crosshair-publish-description'),
            files,
        }).catch(error => {
            this.container.logger.error(`Could not publish a code in guild ${interaction.guild.name} (${interaction.guildId}):`, error);
        });

        if (!post) {
            await modalInteraction.editReply(`❌ Unable to add a post to the gallery.\n-# There is probably a problem with the permissions of the channel that only admins can fix.`);

            return;
        }

        const data = {
            channelId: channel.id,
            postId: post.id,
            originalCode: code,
            hash,
        };

        const newEntry = await this.container.prisma.galleryEntry.create({ data }).catch(error => {
            this.container.logger.error(`Error while trying to create a gallery entry:`, error);
            this.container.logger.debug(data);
        });

        if (!newEntry) {
            await modalInteraction.editReply(`❌ Could not create the new entry in the database. Please try again later.`);

            return;
        }

        await modalInteraction.editReply(`✅ Crosshair published! ${post.url}`);
    }

    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand(
            command =>
                command
                    .setName('crosshair')
                    .setDescription('Explore VALORANT crosshair codes')
                    .addSubcommand(subcommand => subcommand
                        .setName('view')
                        .setDescription('Get a preview of a crosshair code!')
                        .addStringOption(option => option
                            .setName('code')
                            .setDescription(`The code of the crosshair you want to preview`)
                            .setRequired(true)
                        )
                        .addBooleanOption(option => option
                            .setName('view-ads')
                            .setDescription('Whether or not to show the "ADS" mode for the crosshair, if different than primary')
                            .setRequired(false)
                        )
                    )
                    .addSubcommand(subcommand => subcommand
                        .setName('publish')
                        .setDescription(`Publish your crosshair code to this server's gallery`)
                        .addStringOption(option => option
                            .setName('code')
                            .setDescription(`The code of the crosshair you want to preview`)
                            .setRequired(true)
                        )
                    )
        );
    }
}
