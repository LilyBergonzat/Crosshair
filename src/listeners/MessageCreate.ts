import type { Message } from 'discord.js';
import { Events } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener, ListenerOptions } from '@sapphire/framework';
import CrosshairCodeManager from '#structures/managers/CrosshairCodeManager';

@ApplyOptions<ListenerOptions>({
    event: Events.MessageCreate,
})
export default class extends Listener {
    public async run(message: Message): Promise<void> {
        await new CrosshairCodeManager().handleMessageCreate(message);
    }
}
