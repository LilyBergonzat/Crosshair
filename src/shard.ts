import { ShardingManager } from 'discord.js';
import { config as configureEnvironment } from 'dotenv';
import Logger from '@lilywonhalf/pretty-logger';
import { join } from 'node:path';

// Load environment variables
configureEnvironment();

// Path to the compiled bot file (in the same directory after compilation)
const botFile = join(__dirname, 'index.js');

Logger.info('Initializing ShardingManager...');

const manager = new ShardingManager(botFile, {
    token: process.env.TOKEN!,
});

// Listen for shard creation events BEFORE spawning
manager.on('shardCreate', (shard) => {
    Logger.info(`Launched shard ${shard.id}`);
});

Logger.info('Spawning shards...');

manager.spawn().catch(Logger.exception);
