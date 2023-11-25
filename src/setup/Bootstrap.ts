import { IntentsBitField, Partials } from 'discord.js';
import { config as configureEnvironment } from 'dotenv';
import Database from '#root/setup/Database';
import { container, LogLevel, SapphireClient } from '@sapphire/framework';

type BootstrapOptions = {
    dotEnvPath?: string;
};

export class Bootstrap {
    private static instance: Bootstrap;

    public client!: SapphireClient;

    private intents: number[] = [];

    public constructor({ dotEnvPath }: BootstrapOptions = {}) {
        if (Bootstrap.instance) {
            return Bootstrap.instance;
        }

        if (dotEnvPath) {
            configureEnvironment({ path: dotEnvPath });
        } else {
            configureEnvironment();
        }

        Bootstrap.instance = this;
    }

    public initializeIntents(): void {
        this.intents = [
            IntentsBitField.Flags.MessageContent,
            IntentsBitField.Flags.GuildMessages,
            IntentsBitField.Flags.Guilds,
        ];
    }

    public initializeClient(): void {
        this.client = new SapphireClient({
            logger: {
                level: LogLevel.Debug,
            },
            intents: this.intents,
            partials: [
                Partials.User,
                Partials.Channel,
                Partials.GuildMember,
                Partials.Message,
                Partials.Reaction,
                Partials.GuildScheduledEvent,
                Partials.ThreadMember,
            ],
        });
    }

    public async login(): Promise<void> {
        container.database = new Database();

        await container.database.initialize();
        await this.client.login(process.env.TOKEN!);
    }
}
