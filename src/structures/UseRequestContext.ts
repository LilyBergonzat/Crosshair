import { CreateRequestContext } from '@mikro-orm/core';
import { container } from '@sapphire/framework';

export const UseRequestContext = CreateRequestContext.bind(null, container.database.orm);
