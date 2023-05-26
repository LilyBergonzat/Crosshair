const { loadImage, createCanvas } = require('canvas');
const { REST, Routes, Client, GatewayIntentBits, SlashCommandBuilder, AttachmentBuilder} = require('discord.js');
const { config: configureEnvironment } = require('dotenv');

configureEnvironment();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', async client => {
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    const commands = [
        new SlashCommandBuilder()
            .setName('crosshair')
            .setDescription('Get a preview of a crosshair code!')
            .addStringOption(option => option
                .setName('code')
                .setDescription(`The code of the crosshair you want to preview`)
                .setRequired(true)
            )
    ];

    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(client.user.id), { body: commands }).catch(console.error);

    console.log('Successfully reloaded application (/) commands.');
    console.log(`Logged in as ${client.user.tag}!`);
});

const generateImage = async (code) => {
    const hexCodeRegex = /^[0-9A-F]{8}$/g;
    const defaultConfiguration = {
        general: {
            advancedOptions: false,
            adsUsePrimary: true,
            overwriteAllPrimary: false,
            hideOnFire: true,
            followSpectating: true
        },
        primary: {
            color: 0,
            useCustomColor: false,
            hexColor: {enabled: false, value: "FFFFFFFF"},
            outlines: {enabled: true, width: 1, alpha: 0.5},
            dot: {enabled: false, width: 2, alpha: 1},
            overwriteFireMul: false,
            inner: {
                enabled: true,
                width: 2,
                length: 6,
                vertical: {enabled: false, length: 6},
                offset: 3,
                alpha: 0.8,
                moveMul: {enabled: false, mul: 1},
                fireMul: {enabled: true, mul: 1}
            },
            outer: {
                enabled: true,
                width: 2,
                length: 2,
                vertical: {enabled: false, length: 2},
                offset: 10,
                alpha: 0.35,
                moveMul: {enabled: true, mul: 1},
                fireMul: {enabled: true, mul: 1}
            }
        },
        ads: {
            color: 0,
            useCustomColor: false,
            hexColor: {enabled: false, value: "FFFFFFFF"},
            outlines: {enabled: true, width: 1, alpha: 0.5},
            dot: {enabled: false, width: 2, alpha: 1},
            overwriteFireMul: false,
            inner: {
                enabled: true,
                width: 2,
                length: 6,
                vertical: {enabled: false, length: 6},
                offset: 3,
                alpha: 0.8,
                moveMul: {enabled: false, mul: 1},
                fireMul: {enabled: true, mul: 1}
            },
            outer: {
                enabled: true,
                width: 2,
                length: 2,
                vertical: {enabled: false, length: 2},
                offset: 10,
                alpha: 0.35,
                moveMul: {enabled: true, mul: 1},
                fireMul: {enabled: true, mul: 1}
            }
        },
        sniper: {
            color: 7,
            useCustomColor: false,
            hexColor: {enabled: false, value: "FFFFFFFF"},
            dot: {enabled: true, width: 1, alpha: 0.75}
        }
    };
    const xHairExtraConfigurationParts = ['P', 'A', 'S'];
    const width = 128;
    const height = 128;
    const configurationPartConfigurations = {
        // [configurationKey, minBound, maxBound, isInteger, formatter]
        '0:p': ['general.adsUsePrimary', 0, 1, true, e => 0 !== e],
        '0:c': ['general.overwriteAllPrimary', 0, 1, true, e => 0 !== e],
        '0:s': ['general.advancedOptions', 0, 1, true, e => 0 !== e],
        'P:c': ['primary.color', 0, 8, true],
        'P:u': ['primary.hexColor.value', 0, 4294967295, true, e => decimalToHexadecimal(e)],
        'P:h': ['primary.outlines.enabled', 0, 1, true, e => 0 !== e],
        'P:t': ['primary.outlines.width', 1, 6, true],
        'P:o': ['primary.outlines.alpha', 0, 1, false],
        'P:d': ['primary.dot.enabled', 0, 1, true, e => 0 !== e],
        'P:b': ['primary.hexColor.enabled', 0, 1, true, e => 0 !== e],
        'P:z': ['primary.dot.width', 1, 6, true],
        'P:a': ['primary.dot.alpha', 0, 1, false],
        'P:f': ['general.hideOnFire', 0, 1, true, e => 0 !== e],
        'P:s': ['general.followSpectating', 0, 1, true, e => 0 !== e],
        'P:m': ['primary.overwriteFireMul', 0, 1, true, e => 0 !== e],
        'P:0b': ['primary.inner.enabled', 0, 1, true, e => 0 !== e],
        'P:0t': ['primary.inner.width', 0, 10, true],
        'P:0l': ['primary.inner.length', 0, 20, true],
        'P:0v': ['primary.inner.vertical.length', 0, 20, true],
        'P:0g': ['primary.inner.vertical.enabled', 0, 1, true, e => 0 !== e],
        'P:0o': ['primary.inner.offset', 0, 20, true],
        'P:0a': ['primary.inner.alpha', 0, 1, false],
        'P:0m': ['primary.inner.moveMul.enabled', 0, 1, true, e => 0 !== e],
        'P:0f': ['primary.inner.fireMul.enabled', 0, 1, true, e => 0 !== e],
        'P:0s': ['primary.inner.moveMul.mul', 0, 3, false],
        'P:0e': ['primary.inner.fireMul.mul', 0, 3, false],
        'P:1b': ['primary.outer.enabled', 0, 1, true, e => 0 !== e],
        'P:1t': ['primary.outer.width', 0, 10, true],
        'P:1l': ['primary.outer.length', 0, 10, true],
        'P:1v': ['primary.outer.vertical.length', 0, 20, true],
        'P:1g': ['primary.outer.vertical.enabled', 0, 1, true, e => 0 !== e],
        'P:1o': ['primary.outer.offset', 0, 40, true],
        'P:1a': ['primary.outer.alpha', 0, 1, false],
        'P:1m': ['primary.outer.moveMul.enabled', 0, 1, true, e => 0 !== e],
        'P:1f': ['primary.outer.fireMul.enabled', 0, 1, true, e => 0 !== e],
        'P:1s': ['primary.outer.moveMul.mul', 0, 3, false],
        'P:1e': ['primary.outer.fireMul.mul', 0, 3, false],
        'A:c': ['ads.color', 0, 8, true],
        'A:u': ['ads.hexColor.value', 0, 4294967295, true, e => decimalToHexadecimal(e)],
        'A:h': ['ads.outlines.enabled', 0, 1, true, e => 0 !== e],
        'A:t': ['ads.outlines.width', 1, 6, true],
        'A:o': ['ads.outlines.alpha', 0, 1, false],
        'A:d': ['ads.dot.enabled', 0, 1, true, e => 0 !== e],
        'A:b': ['ads.hexColor.enabled', 0, 1, true, e => 0 !== e],
        'A:z': ['ads.dot.width', 1, 6, true],
        'A:a': ['ads.dot.alpha', 0, 1, false],
        'A:m': ['ads.overwriteFireMul', 0, 1, true, e => 0 !== e],
        'A:0b': ['ads.inner.enabled', 0, 1, true, e => 0 !== e],
        'A:0t': ['ads.inner.width', 0, 10, true],
        'A:0l': ['ads.inner.length', 0, 20, true],
        'A:0v': ['ads.inner.vertical.length', 0, 20, true],
        'A:0g': ['ads.inner.vertical.enabled', 0, 1, true, e => 0 !== e],
        'A:0o': ['ads.inner.offset', 0, 20, true],
        'A:0a': ['ads.inner.alpha', 0, 1, false],
        'A:0m': ['ads.inner.moveMul.enabled', 0, 1, true, e => 0 !== e],
        'A:0f': ['ads.inner.fireMul.enabled', 0, 1, true, e => 0 !== e],
        'A:0s': ['ads.inner.moveMul.mul', 0, 3, false],
        'A:0e': ['ads.inner.fireMul.mul', 0, 3, false],
        'A:1b': ['ads.outer.enabled', 0, 1, true, e => 0 !== e],
        'A:1t': ['ads.outer.width', 0, 10, true],
        'A:1l': ['ads.outer.length', 0, 10, true],
        'A:1v': ['ads.outer.vertical.length', 0, 20, true],
        'A:1g': ['ads.outer.vertical.enabled', 0, 1, true, e => 0 !== e],
        'A:1o': ['ads.outer.offset', 0, 40, true],
        'A:1a': ['ads.outer.alpha', 0, 1, false],
        'A:1m': ['ads.outer.moveMul.enabled', 0, 1, true, e => 0 !== e],
        'A:1f': ['ads.outer.fireMul.enabled', 0, 1, true, e => 0 !== e],
        'A:1s': ['ads.outer.moveMul.mul', 0, 3, false],
        'A:1e': ['ads.outer.fireMul.mul', 0, 3, false],
        'S:b': ['sniper.hexColor.enabled', 0, 1, true, e => 0 !== e],
        'S:c': ['sniper.color', 0, 8, true],
        'S:t': ['sniper.hexColor.value', 0, 4294967295, true, e => decimalToHexadecimal(e)],
        'S:d': ['sniper.dot.enabled', 0, 1, true, e => 0 !== e],
        'S:s': ['sniper.dot.width', 0, 4, false],
        'S:o': ['sniper.dot.alpha', 0, 1, false],
    };
    const colours = ['#ffffff', '#00ff00', '#7fff00', '#dfff00', '#ffff00', '#00ffff', '#ff00ff', '#ff0000'];
    const backgrounds = await Promise.all(
        Array(9).fill('').map((value, key) => loadImage(`./img/${key + 1}.png`))
    );

    const decimalToHexadecimal = function (decimalColorCode) {
        let t = decimalColorCode.toString(16).toUpperCase();

        if (t.length < 8) {
            t = '0'.repeat(8 - t.length) + t;
        }

        return t;
    };

    const codeToConfiguration = function (code) {
        const codeParts = code.split(';');
        const currentCode = JSON.parse(JSON.stringify(defaultConfiguration));

        if (codeParts.length <= 1) {
            return currentCode;
        }

        const parsedConfigurationCategories = [];
        const codePartsAmount = codeParts.length;
        let currentConfigurationCategory = '0';

        for (let i = 1; i < codePartsAmount; i += 2) {
            if (xHairExtraConfigurationParts.includes(codeParts[i])) {
                currentConfigurationCategory = codeParts[i];
                i--;

                if (parsedConfigurationCategories.includes(currentConfigurationCategory)) {
                    console.error('got category ' + currentConfigurationCategory + ' twice? skipping rest');

                    return currentCode;
                }

                parsedConfigurationCategories.push(currentConfigurationCategory);

                continue;
            }

            const value = getCodePartValueFromIndex(codeParts, i);

            if (value === false) {
                console.error('ignoring invalid key: ' + codeParts[i]);
                continue;
            }

            const l = currentConfigurationCategory + ':' + codeParts[i];
            const codePartConfiguration = configurationPartConfigurations[l];

            if (!codePartConfiguration) {
                console.error('ignoring unmapped key: ' + l);
                continue;
            }

            if (codePartConfiguration[3] && !Number.isInteger(value)) {
                console.error('ignoring non-int value: ' + l + '=' + value);
                continue;
            }

            if (value < codePartConfiguration[1] || value > codePartConfiguration[2]) {
                console.error('ignoring out of bounds value: ' + l + '=' + value);
                continue;
            }

            const codePartConfigurationKey = codePartConfiguration[0].split('.');
            let c = currentCode;

            for (let i = 0; i < codePartConfigurationKey.length - 1; i++) {
                c = c[codePartConfigurationKey[i]];
            }

            const lastKey = codePartConfigurationKey[codePartConfigurationKey.length - 1];

            c[lastKey] = codePartConfiguration.length >= 5 ? codePartConfiguration[4](value) : value
        }

        return currentCode;
    };

    const getCodePartValueFromIndex = function (codeParts, index) {
        if (codeParts.length > index + 1) {
            if (8 === codeParts[index + 1].length && codeParts[index + 1].match(hexCodeRegex)) {
                return parseInt(codeParts[index + 1], 16);
            }

            const n = parseFloat(codeParts[index + 1]);

            if (!isNaN(n)) {
                return n
            }
        }

        return false;
    };

    const drawCrosshair = (context2D, globalData, codeData, centerPoint) => {
        const outlines = codeData.outlines;
        const xywh = { xy: 0.5 * outlines.width, wh: 1 * outlines.width };

        if (codeData.color === 8) {
            context2D.fillStyle = '#' + codeData.hexColor.value.slice(0, 6);
        } else {
            context2D.fillStyle = colours[codeData.color];
        }

        context2D.lineWidth = outlines.width;

        const xHairParts = ['inner', 'dot', 'outer'];

        for (const xHairPartKey in xHairParts) {
            const xHairPart = xHairParts[xHairPartKey];

            if (xHairPart === 'dot') {
                if (!codeData.dot.enabled) {
                    continue;
                }

                const { width: dotWidth, alpha: dotAlpha } = codeData.dot;

                context2D.globalAlpha = dotAlpha;

                const centerX = centerPoint[0] - Math.ceil(dotWidth / 2);
                const centerY = centerPoint[1] - Math.ceil(dotWidth / 2);

                context2D.fillRect(centerX, centerY, dotWidth, dotWidth);

                if (outlines.enabled) {
                    context2D.globalAlpha = outlines.alpha;
                    context2D.strokeRect(
                        centerX - xywh.xy,
                        centerY - xywh.xy,
                        dotWidth + xywh.wh,
                        dotWidth + xywh.wh
                    );
                }

                continue;
            }

            const xHairPartConfiguration = codeData[xHairPart];

            if (!xHairPartConfiguration.enabled) {
                continue;
            }

            let { offset, width, length, alpha, fireMul } = xHairPartConfiguration;

            if (fireMul.enabled && !codeData.overwriteFireMul) {
                offset += 4;
            }

            const halfPartWidth = width % 2;
            const [x1, y1] = [centerPoint[0] + offset, Math.floor(centerPoint[1] - width / 2)];
            const [x2, y2] = [centerPoint[0] - offset - length - halfPartWidth, Math.floor(centerPoint[1] - width / 2)];

            drawLine(context2D, x1, y1, length, width, xywh, outlines, alpha);
            drawLine(context2D, x2, y2, length, width, xywh, outlines, alpha);

            if (xHairPartConfiguration.vertical.enabled) {
                length = xHairPartConfiguration.vertical.length;
            }

            const [x3, y3] = [Math.floor(centerPoint[0] - width / 2), centerPoint[1] + offset];
            const [x4, y4] = [Math.floor(centerPoint[0] - width / 2), centerPoint[1] - offset - length - halfPartWidth];

            drawLine(context2D, x3, y3, width, length, xywh, outlines, alpha);
            drawLine(context2D, x4, y4, width, length, xywh, outlines, alpha);
        }
    };

    const drawCanvas = async (codeData, canvas, backgrounds) => {
        const globalData = codeData;
        const context2D = canvas.getContext('2d');

        context2D.imageSmoothingEnabled = false;
        context2D.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < backgrounds.length; i++) {
            codeData = globalData;

            const [offsetX, offsetY] = [i % 3 * width, Math.floor(i / 3) * height];
            const centerPoint = [offsetX + width / 2, offsetY + height / 2];

            context2D.drawImage(backgrounds[i], offsetX, offsetY, width, height);

            codeData = codeData[globalData.general.adsUsePrimary ? 'primary' : 'ads']
            drawCrosshair(context2D, globalData, codeData, centerPoint);
        }

        return canvas
    };

    const drawLine = function (context2D, x, y, width, height, xywh, outlines, alpha) {
        context2D.globalAlpha = alpha;
        context2D.fillRect(x, y, width, height);

        if (outlines.enabled && width !== 0 && height !== 0) {
            context2D.globalAlpha = outlines.alpha;
            context2D.strokeRect(x - xywh.xy, y - xywh.xy, width + xywh.wh, height + xywh.wh);
        }
    }

    const canvas = await drawCanvas(
        codeToConfiguration(code),
        createCanvas(width * 3, height * 3),
        backgrounds
    );

    return canvas.toBuffer('image/png');
};

const testCode = function (code) {
    return /^0[a-zA-Z0-9;.]*$/.test(code.trim());
};

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand() && interaction.commandName !== 'crosshair') {
        return;
    }

    const code = interaction.options.getString('code', true);

    await interaction.deferReply({ ephemeral: true });

    if (!testCode(code)) {
        await interaction.editReply(`The code you sent is incorrect.`);

        return;
    }

    const image = new AttachmentBuilder(await generateImage(code));

    await interaction.editReply({ files: [image] });
});

client.login(process.env.TOKEN).catch(console.error);

