import type { Collection } from 'discord.js';

export default interface Repository<T> {
    getList(): Promise<Collection<string | number, T> | Array<T>>;
}
