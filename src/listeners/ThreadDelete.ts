import type { ThreadChannel } from 'discord.js';
import { Events } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener, ListenerOptions } from '@sapphire/framework';

@ApplyOptions<ListenerOptions>({
    event: Events.ThreadDelete,
})
export default class extends Listener {
    public async run(thread: ThreadChannel): Promise<void> {
        await this.container.prisma.galleryEntry.deleteMany({ where: { postId: thread.id } });
    }
}
