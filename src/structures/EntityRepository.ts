import type { Collection } from 'discord.js';
import { EntityRepository as MikroORMEntityRepository } from '@mikro-orm/mysql';
import type { SqlEntityManager } from '@mikro-orm/knex';
import type { EntityName } from '@mikro-orm/core';
import type Repository from '#structures/Repository';

// eslint-disable-next-line @typescript-eslint/ban-types
export default class EntityRepository<T extends {}>
    extends MikroORMEntityRepository<T>
    implements Repository<T>
{
    protected static CACHE_KEY_PREFIX = 'entity';

    constructor(_em: SqlEntityManager, entityName: EntityName<T>) {
        super(_em, entityName);
    }

    async getList(): Promise<Collection<string | number, T> | Array<T>> {
        const list = await this.findAll();

        return [...list.values()];
    }

    protected static getCacheKey(params: Record<string, string>): string {
        return `${this.CACHE_KEY_PREFIX}_${Object.keys(params).map(key => {
            return `${key}${params[key] ? `_${params[key]}` : ''}`;
        }).join('_')}`;
    }
}
