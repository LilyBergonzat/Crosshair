import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { config as configureEnvironment } from 'dotenv';
import { MigrationGenerator } from '#structures/MigrationGenerator';

configureEnvironment({ path: '../.env' });

export default {
    metadataProvider: TsMorphMetadataProvider,
    entities: ['../dist/structures/entities'],
    entitiesTs: ['../src/structures/entities'],
    dbName: process.env.DBNAME,
    user: process.env.DBUSER,
    host: process.env.DBHOST,
    password: process.env.DBPASSWORD,
    port: Number(process.env.DBPORT),
    type: 'mysql',
    driverOptions: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
    },
    migrations: {
        generator: MigrationGenerator,
        path: '../dist/migrations',
        pathTs: '../src/migrations',
    },
}
