import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import type { MySqlDriver } from '@mikro-orm/mysql';
import Logger from '@lilywonhalf/pretty-logger';
import AutoEmbedChannelRepository from '#structures/repositories/AutoEmbedChannelRepository';
import { MigrationGenerator } from '#structures/MigrationGenerator';
import { AutoEmbedChannel } from '#structures/entities/AutoEmbedChannel';

export default class Database {
    private static instance: Database;

    private _orm!: MikroORM<MySqlDriver>;
    private _em!: EntityManager;
    private _autoEmbedChannelRepository!: AutoEmbedChannelRepository;

    public constructor() {
        if (Database.instance) {
            return Database.instance;
        }

        Database.instance = this;
    }

    public async initialize() {
        this._orm = await MikroORM.init<MySqlDriver>({
            metadataProvider: TsMorphMetadataProvider,
            entities: ['./dist/structures/entities'],
            entitiesTs: ['./src/structures/entities'],
            logger: (message: string) => Logger.info(message),
            debug: true,
            type: 'mysql',
            dbName: process.env.DBNAME,
            user: process.env.DBUSER,
            host: process.env.DBHOST,
            password: process.env.DBPASSWORD,
            port: Number(process.env.DBPORT),
            driverOptions: {
                charset: 'utf8mb4',
                collate: 'utf8mb4_general_ci',
            },
            migrations: {
                generator: MigrationGenerator,
                path: './dist/migrations',
                pathTs: './src/migrations',
            },
        });

        this._em = this.orm.em.fork();

        this._autoEmbedChannelRepository = this.em.getRepository(AutoEmbedChannel);
    }

    public get orm() {
        return this._orm;
    }

    public get em() {
        return this._em;
    }

    public get autoEmbedChannelRepository() {
        return this._autoEmbedChannelRepository;
    }
}
