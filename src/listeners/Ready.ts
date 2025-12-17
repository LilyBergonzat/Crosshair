import Logger from '@lilywonhalf/pretty-logger';
import type { Client } from 'discord.js';
import { Events } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener, ListenerOptions } from '@sapphire/framework';

@ApplyOptions<ListenerOptions>({
    event: Events.ClientReady,
})
export default class extends Listener {
    public async run(client: Client): Promise<void> {
        const nbGuilds = client.guilds.cache.size;
        const shardId = client.shard?.ids[0] ?? 0;
        const totalShards = client.shard?.count ?? 1;

        Logger.info(`Logged in as ${client.user!.username}#${client.user!.discriminator}`);
        Logger.info(`Shard ${shardId}/${totalShards - 1} serving ${nbGuilds} guild${nbGuilds > 1 ? 's' : ''}`);
    }
}
