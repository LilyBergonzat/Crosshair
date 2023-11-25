import Logger from '@lilywonhalf/pretty-logger';
import { Bootstrap } from '#root/setup/Bootstrap';
import type Database from '#root/setup/Database';

Logger.info('Booting up application...');

const bootstrap = new Bootstrap();

bootstrap.initializeIntents();
bootstrap.initializeClient();

Logger.info('Application initialized');
Logger.info('Logging in...');

bootstrap.login().catch(Logger.exception);

declare module '@sapphire/pieces' {
    interface Container {
        database: Database;
    }
}
