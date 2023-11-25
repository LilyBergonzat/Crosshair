import { loadImage, createCanvas, CanvasRenderingContext2D, Canvas, Image } from 'canvas';
import Logger from '@lilywonhalf/pretty-logger';

class CrosshairUtil {
    private static xHairExtraConfigurationParts: string[] = ['P', 'A', 'S'];
    private static hexCodeRegex: RegExp = /^[0-9A-F]{8}$/gu;
    private static crosshairCodeRegex: RegExp = /0(?:;[pcs];\d){0,3}(?:;[PA](?:;(?:c|u|h|t|o|d|b|z|a|f|s|m|0b|0t|0l|0v|0g|0o|0a|0m|0f|0s|0e|1b|1t|1l|1v|1g|1o|1a|1m|1f|1s|1e);[0-9a-fA-F.]{0,20}){0,34}){1,2}(?:;S(?:;[bctdso];[0-9a-fA-F.]{0,20}){0,6})?/u;
    private static colours: string[] = [
        '#ffffff',
        '#00ff00',
        '#7fff00',
        '#dfff00',
        '#ffff00',
        '#00ffff',
        '#ff00ff',
        '#ff0000',
    ];

    private static defaultConfiguration: CrosshairConfiguration = {
        general: {
            advancedOptions: false,
            adsUsePrimary: true,
            overwriteAllPrimary: false,
            hideOnFire: true,
            followSpectating: true,
        },
        primary: {
            color: 0,
            useCustomColor: false,
            hexColor: { enabled: false, value: 'FFFFFFFF' },
            outlines: { enabled: true, width: 1, alpha: 0.5 },
            dot: { enabled: false, width: 2, alpha: 1 },
            overwriteFireMul: false,
            inner: {
                enabled: true,
                width: 2,
                length: 6,
                vertical: { enabled: false, length: 6 },
                offset: 3,
                alpha: 0.8,
                moveMul: { enabled: false, mul: 1 },
                fireMul: { enabled: true, mul: 1 },
            },
            outer: {
                enabled: true,
                width: 2,
                length: 2,
                vertical: { enabled: false, length: 2 },
                offset: 10,
                alpha: 0.35,
                moveMul: { enabled: true, mul: 1 },
                fireMul: { enabled: true, mul: 1 },
            },
        },
        ads: {
            color: 0,
            useCustomColor: false,
            hexColor: { enabled: false, value: 'FFFFFFFF' },
            outlines: { enabled: true, width: 1, alpha: 0.5 },
            dot: { enabled: false, width: 2, alpha: 1 },
            overwriteFireMul: false,
            inner: {
                enabled: true,
                width: 2,
                length: 6,
                vertical: { enabled: false, length: 6 },
                offset: 3,
                alpha: 0.8,
                moveMul: { enabled: false, mul: 1 },
                fireMul: { enabled: true, mul: 1 },
            },
            outer: {
                enabled: true,
                width: 2,
                length: 2,
                vertical: { enabled: false, length: 2 },
                offset: 10,
                alpha: 0.35,
                moveMul: { enabled: true, mul: 1 },
                fireMul: { enabled: true, mul: 1 },
            },
        },
        sniper: {
            color: 7,
            useCustomColor: false,
            hexColor: { enabled: false, value: 'FFFFFFFF' },
            dot: { enabled: true, width: 1, alpha: 0.75 },
        },
    };

    private static configurationPartConfigurations: Record<string, ConfigurationPartConfiguration> = {
        // [configurationKey, minBound, maxBound, isInteger, formatter]
        '0:p': ['general.adsUsePrimary', 0, 1, true, (e: number) => 0 !== e],
        '0:c': ['general.overwriteAllPrimary', 0, 1, true, (e: number) => 0 !== e],
        '0:s': ['general.advancedOptions', 0, 1, true, (e: number) => 0 !== e],
        'P:c': ['primary.color', 0, 8, true],
        'P:u': ['primary.hexColor.value', 0, 4294967295, true, (e: number) => CrosshairUtil.decimalToHexadecimal(e)],
        'P:h': ['primary.outlines.enabled', 0, 1, true, (e: number) => 0 !== e],
        'P:t': ['primary.outlines.width', 1, 6, true],
        'P:o': ['primary.outlines.alpha', 0, 1, false],
        'P:d': ['primary.dot.enabled', 0, 1, true, (e: number) => 0 !== e],
        'P:b': ['primary.hexColor.enabled', 0, 1, true, (e: number) => 0 !== e],
        'P:z': ['primary.dot.width', 1, 6, true],
        'P:a': ['primary.dot.alpha', 0, 1, false],
        'P:f': ['general.hideOnFire', 0, 1, true, (e: number) => 0 !== e],
        'P:s': ['general.followSpectating', 0, 1, true, (e: number) => 0 !== e],
        'P:m': ['primary.overwriteFireMul', 0, 1, true, (e: number) => 0 !== e],
        'P:0b': ['primary.inner.enabled', 0, 1, true, (e: number) => 0 !== e],
        'P:0t': ['primary.inner.width', 0, 10, true],
        'P:0l': ['primary.inner.length', 0, 20, true],
        'P:0v': ['primary.inner.vertical.length', 0, 20, true],
        'P:0g': ['primary.inner.vertical.enabled', 0, 1, true, (e: number) => 0 !== e],
        'P:0o': ['primary.inner.offset', 0, 20, true],
        'P:0a': ['primary.inner.alpha', 0, 1, false],
        'P:0m': ['primary.inner.moveMul.enabled', 0, 1, true, (e: number) => 0 !== e],
        'P:0f': ['primary.inner.fireMul.enabled', 0, 1, true, (e: number) => 0 !== e],
        'P:0s': ['primary.inner.moveMul.mul', 0, 3, false],
        'P:0e': ['primary.inner.fireMul.mul', 0, 3, false],
        'P:1b': ['primary.outer.enabled', 0, 1, true, (e: number) => 0 !== e],
        'P:1t': ['primary.outer.width', 0, 10, true],
        'P:1l': ['primary.outer.length', 0, 10, true],
        'P:1v': ['primary.outer.vertical.length', 0, 20, true],
        'P:1g': ['primary.outer.vertical.enabled', 0, 1, true, (e: number) => 0 !== e],
        'P:1o': ['primary.outer.offset', 0, 40, true],
        'P:1a': ['primary.outer.alpha', 0, 1, false],
        'P:1m': ['primary.outer.moveMul.enabled', 0, 1, true, (e: number) => 0 !== e],
        'P:1f': ['primary.outer.fireMul.enabled', 0, 1, true, (e: number) => 0 !== e],
        'P:1s': ['primary.outer.moveMul.mul', 0, 3, false],
        'P:1e': ['primary.outer.fireMul.mul', 0, 3, false],
        'A:c': ['ads.color', 0, 8, true],
        'A:u': ['ads.hexColor.value', 0, 4294967295, true, (e: number) => CrosshairUtil.decimalToHexadecimal(e)],
        'A:h': ['ads.outlines.enabled', 0, 1, true, (e: number) => 0 !== e],
        'A:t': ['ads.outlines.width', 1, 6, true],
        'A:o': ['ads.outlines.alpha', 0, 1, false],
        'A:d': ['ads.dot.enabled', 0, 1, true, (e: number) => 0 !== e],
        'A:b': ['ads.hexColor.enabled', 0, 1, true, (e: number) => 0 !== e],
        'A:z': ['ads.dot.width', 1, 6, true],
        'A:a': ['ads.dot.alpha', 0, 1, false],
        'A:m': ['ads.overwriteFireMul', 0, 1, true, (e: number) => 0 !== e],
        'A:0b': ['ads.inner.enabled', 0, 1, true, (e: number) => 0 !== e],
        'A:0t': ['ads.inner.width', 0, 10, true],
        'A:0l': ['ads.inner.length', 0, 20, true],
        'A:0v': ['ads.inner.vertical.length', 0, 20, true],
        'A:0g': ['ads.inner.vertical.enabled', 0, 1, true, (e: number) => 0 !== e],
        'A:0o': ['ads.inner.offset', 0, 20, true],
        'A:0a': ['ads.inner.alpha', 0, 1, false],
        'A:0m': ['ads.inner.moveMul.enabled', 0, 1, true, (e: number) => 0 !== e],
        'A:0f': ['ads.inner.fireMul.enabled', 0, 1, true, (e: number) => 0 !== e],
        'A:0s': ['ads.inner.moveMul.mul', 0, 3, false],
        'A:0e': ['ads.inner.fireMul.mul', 0, 3, false],
        'A:1b': ['ads.outer.enabled', 0, 1, true, (e: number) => 0 !== e],
        'A:1t': ['ads.outer.width', 0, 10, true],
        'A:1l': ['ads.outer.length', 0, 10, true],
        'A:1v': ['ads.outer.vertical.length', 0, 20, true],
        'A:1g': ['ads.outer.vertical.enabled', 0, 1, true, (e: number) => 0 !== e],
        'A:1o': ['ads.outer.offset', 0, 40, true],
        'A:1a': ['ads.outer.alpha', 0, 1, false],
        'A:1m': ['ads.outer.moveMul.enabled', 0, 1, true, (e: number) => 0 !== e],
        'A:1f': ['ads.outer.fireMul.enabled', 0, 1, true, (e: number) => 0 !== e],
        'A:1s': ['ads.outer.moveMul.mul', 0, 3, false],
        'A:1e': ['ads.outer.fireMul.mul', 0, 3, false],
        'S:b': ['sniper.hexColor.enabled', 0, 1, true, (e: number) => 0 !== e],
        'S:c': ['sniper.color', 0, 8, true],
        'S:t': ['sniper.hexColor.value', 0, 4294967295, true, (e: number) => CrosshairUtil.decimalToHexadecimal(e)],
        'S:d': ['sniper.dot.enabled', 0, 1, true, (e: number) => 0 !== e],
        'S:s': ['sniper.dot.width', 0, 4, false],
        'S:o': ['sniper.dot.alpha', 0, 1, false],
    };

    public static testCode(code: string): boolean {
        return /^0[a-zA-Z0-9;.]*$/u.test(code.trim());
    }

    public static hasCode(string: string): boolean {
        return CrosshairUtil.crosshairCodeRegex.test(string.trim());
    }

    public static getCode(string: string): string | undefined {
        const match = string.match(CrosshairUtil.crosshairCodeRegex);

        return match ? match[0] : undefined;
    }

    public static async generateImage(code: string): Promise<Buffer> {
        const width = 128;
        const height = 128;
        const backgrounds = await Promise.all(
            Array(9).fill('').map((_, key) => loadImage(`./img/${key + 1}.png`))
        );

        const canvas = await CrosshairUtil.drawCanvas(
            CrosshairUtil.codeToConfiguration(code),
            createCanvas(width * 3, height * 3),
            width,
            height,
            backgrounds
        );

        return canvas.toBuffer('image/png');
    }

    private static decimalToHexadecimal(decimalColorCode: number): string {
        let t = decimalColorCode.toString(16).toUpperCase();

        if (t.length < 8) {
            t = '0'.repeat(8 - t.length) + t;
        }

        return t;
    }

    private static codeToConfiguration(code: string): CrosshairConfiguration {
        const codeParts = code.split(';');
        const currentCode = JSON.parse(JSON.stringify(CrosshairUtil.defaultConfiguration));

        if (codeParts.length <= 1) {
            return currentCode;
        }

        const parsedConfigurationCategories: string[] = [];
        const codePartsAmount = codeParts.length;
        let currentConfigurationCategory = '0';

        for (let i = 1; i < codePartsAmount; i += 2) {
            if (CrosshairUtil.xHairExtraConfigurationParts.includes(codeParts[i])) {
                currentConfigurationCategory = codeParts[i];
                i--;

                if (parsedConfigurationCategories.includes(currentConfigurationCategory)) {
                    Logger.error('got category ' + currentConfigurationCategory + ' twice? skipping rest');

                    return currentCode;
                }

                parsedConfigurationCategories.push(currentConfigurationCategory);

                continue;
            }

            const value = CrosshairUtil.getCodePartValueFromIndex(codeParts, i);

            if (value === false) {
                Logger.error('ignoring invalid key: ' + codeParts[i]);
                continue;
            }

            const l = currentConfigurationCategory + ':' + codeParts[i];
            const codePartConfiguration = CrosshairUtil.configurationPartConfigurations[l];

            if (!codePartConfiguration) {
                Logger.error('ignoring unmapped key: ' + l);
                continue;
            }

            if (codePartConfiguration[3] && !Number.isInteger(value)) {
                Logger.error('ignoring non-int value: ' + l + '=' + value);
                continue;
            }

            if (value < codePartConfiguration[1] || value > codePartConfiguration[2]) {
                Logger.error('ignoring out of bounds value: ' + l + '=' + value);
                continue;
            }

            const codePartConfigurationKey = codePartConfiguration[0].split('.');
            let c = currentCode;

            for (let i = 0; i < codePartConfigurationKey.length - 1; i++) {
                c = c[codePartConfigurationKey[i]];
            }

            const lastKey = codePartConfigurationKey[codePartConfigurationKey.length - 1];

            c[lastKey] = codePartConfiguration.length >= 5 ? codePartConfiguration[4]!(value) : value
        }

        return currentCode;
    }

    private static getCodePartValueFromIndex(codeParts: string[], index: number): number|false {
        if (codeParts.length > index + 1) {
            if (8 === codeParts[index + 1].length && codeParts[index + 1].match(CrosshairUtil.hexCodeRegex)) {
                return parseInt(codeParts[index + 1], 16);
            }

            const n = parseFloat(codeParts[index + 1]);

            if (!isNaN(n)) {
                return n
            }
        }

        return false;
    }

    private static drawCrosshair(
        context2D: CanvasRenderingContext2D,
        codeData: CrosshairConfigurationPrimaryAds,
        centerPoint: number[]
    ): void {
        const { outlines } = codeData;
        const xywh = { xy: 0.5 * outlines.width, wh: outlines.width };

        if (codeData.color === 8) {
            context2D.fillStyle = '#' + codeData.hexColor.value.slice(0, 6);
        } else {
            context2D.fillStyle = CrosshairUtil.colours[codeData.color];
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

            const xHairPartConfiguration = codeData[
                xHairPart as keyof CrosshairConfigurationPrimaryAds
            ] as CrosshairConfigurationPrimaryAdsPart;

            if (!xHairPartConfiguration.enabled) {
                continue;
            }

            const { width, alpha, fireMul } = xHairPartConfiguration;
            let { offset, length } = xHairPartConfiguration;

            if (fireMul.enabled && !codeData.overwriteFireMul) {
                offset += 4;
            }

            const halfPartWidth = width % 2;
            const [x1, y1] = [centerPoint[0] + offset, Math.floor(centerPoint[1] - width / 2)];
            const [x2, y2] = [
                centerPoint[0] - offset - length - halfPartWidth,
                Math.floor(centerPoint[1] - width / 2),
            ];

            // noinspection JSSuspiciousNameCombination
            CrosshairUtil.drawLine(context2D, x1, y1, length, width, xywh, outlines, alpha);
            // noinspection JSSuspiciousNameCombination
            CrosshairUtil.drawLine(context2D, x2, y2, length, width, xywh, outlines, alpha);

            if (xHairPartConfiguration.vertical.enabled) {
                // eslint-disable-next-line prefer-destructuring
                length = xHairPartConfiguration.vertical.length;
            }

            if (length === 0) {
                continue;
            }

            const [x3, y3] = [Math.floor(centerPoint[0] - width / 2), centerPoint[1] + offset];
            const [x4, y4] = [
                Math.floor(centerPoint[0] - width / 2),
                centerPoint[1] - offset - length - halfPartWidth,
            ];

            CrosshairUtil.drawLine(context2D, x3, y3, width, length, xywh, outlines, alpha);
            CrosshairUtil.drawLine(context2D, x4, y4, width, length, xywh, outlines, alpha);
        }
    }

    private static async drawCanvas(
        codeData: CrosshairConfiguration,
        canvas: Canvas,
        width: number,
        height: number,
        backgrounds: Image[]
    ): Promise<Canvas> {
        const globalData = codeData;
        const context2D = canvas.getContext('2d');

        context2D.imageSmoothingEnabled = false;
        context2D.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < backgrounds.length; i++) {
            codeData = globalData;

            const [offsetX, offsetY] = [i % 3 * width, Math.floor(i / 3) * height];
            const centerPoint = [offsetX + width / 2, offsetY + height / 2];

            context2D.drawImage(backgrounds[i], offsetX, offsetY, width, height);

            CrosshairUtil.drawCrosshair(
                context2D,
                codeData[globalData.general.adsUsePrimary ? 'primary' : 'ads'],
                centerPoint
            );
        }

        return canvas;
    }

    private static drawLine(
        context2D: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        xywh: { xy: number; wh: number },
        outlines: CrosshairConfigurationOutlines,
        alpha: number
    ): void {
        context2D.globalAlpha = alpha;
        context2D.fillRect(x, y, width, height);

        if (outlines.enabled && width !== 0 && height !== 0) {
            context2D.globalAlpha = outlines.alpha;
            context2D.strokeRect(x - xywh.xy, y - xywh.xy, width + xywh.wh, height + xywh.wh);
        }
    }
}

type ConfigurationPartConfiguration = [string, number, number, boolean, ((e: number) => boolean|string)?];

interface CrosshairConfiguration {
    general: CrosshairConfigurationGeneral,
    primary: CrosshairConfigurationPrimaryAds,
    ads: CrosshairConfigurationPrimaryAds,
    sniper: CrosshairConfigurationSniper,
}

interface CrosshairConfigurationGeneral {
    advancedOptions: boolean,
    adsUsePrimary: boolean,
    overwriteAllPrimary: boolean,
    hideOnFire: boolean,
    followSpectating: boolean,
}

interface CrosshairConfigurationPrimaryAds {
    color: number,
    useCustomColor: boolean,
    hexColor: { enabled: boolean, value: string },
    outlines: CrosshairConfigurationOutlines,
    overwriteFireMul: boolean,
    dot: { enabled: boolean, width: number, alpha: number },
    inner: CrosshairConfigurationPrimaryAdsPart,
    outer: CrosshairConfigurationPrimaryAdsPart,
}

interface CrosshairConfigurationPrimaryAdsPart {
    enabled: boolean,
    width: number,
    length: number,
    vertical: { enabled: boolean, length: number },
    offset: number,
    alpha: number,
    moveMul: { enabled: boolean, mul: number },
    fireMul: { enabled: boolean, mul: number },
}

interface CrosshairConfigurationSniper {
    color: number,
    useCustomColor: boolean,
    hexColor: { enabled: boolean, value: string },
    dot: { enabled: boolean, width: number, alpha: number },
}

interface CrosshairConfigurationOutlines {
    enabled: boolean,
    width: number,
    alpha: number,
}

export const { testCode, hasCode, getCode, generateImage } = CrosshairUtil;
