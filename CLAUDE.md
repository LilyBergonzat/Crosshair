# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**IMPORTANT:** When making significant changes to the codebase architecture, commands, or database schema, update this file to keep it accurate and helpful for future instances.

## Project Overview

Discord bot for the Valorant community that generates crosshair preview images from crosshair codes and manages a server gallery of submitted crosshairs.

**Tech Stack:** TypeScript, Discord.js v14, Sapphire Framework, Prisma ORM, MySQL, Canvas

## Development Commands

```bash
# Compile and run
npm start

# Run without recompiling
npm run quickstart

# Compile TypeScript
npm run compile

# Clean build
npm run clean-compile

# Watch mode
npm run watch

# Database migrations (Prisma)
npx prisma migrate dev        # Create and apply migration
npx prisma migrate deploy     # Apply pending migrations (production)
npx prisma generate           # Regenerate Prisma client after schema changes
npx prisma studio             # Open database GUI
```

## Environment Setup

Copy `.sample.env` to `.env` and configure:
- `TOKEN` - Discord bot token
- `OWNER` - Owner Discord user ID (for `/eval` command)
- `TEST_GUILD` - Guild ID for testing owner-only commands
- Database credentials: `DBNAME`, `DBUSER`, `DBHOST`, `DBPASSWORD`, `DBPORT`
- `DATABASE_URL` is auto-constructed from DB credentials

## Architecture

### Sharding

The bot uses **Discord.js ShardingManager** to handle multiple shards across separate processes. This is essential for bots in 2,500+ guilds (Discord's gateway limit).

**Entry Points:**
- **`src/shard.ts`** - ShardingManager that spawns and manages shards
  - Compiled to `dist/shard.js` and run via `npm start` or `npm run quickstart`
  - Automatically spawns the recommended number of shards (~1,000 guilds per shard)
  - Logs shard creation events

- **`src/index.ts`** - Bot client code that gets spawned by each shard
  - Each shard runs as a separate process with its own Bootstrap/client instance
  - Handles a subset of guilds assigned by Discord

**Cross-Shard Communication:**
- Use `client.shard.fetchClientValues()` to aggregate properties across shards
- Use `client.shard.broadcastEval()` to execute code on all shards
- Example: Getting total guild count across all shards:
  ```typescript
  const results = await client.shard.fetchClientValues('guilds.cache.size');
  const totalGuilds = results.reduce((acc, count) => acc + count, 0);
  ```

**Owner-Only Debug Commands:**

**/eval** - Execute Node.js code with shard targeting
- `code` (required) - The code to execute
- `shard` (optional) - Execute on specific shard ID
- `all-shards` (optional) - Execute on all shards
- Default behavior: Executes on current shard only
- Shows execution mode and results per shard

**/shard-info** - Get shard information for a guild ID
- `guild-id` (required) - The Discord guild ID to check
- Calculates which shard handles that guild
- Shows guild name, member count, and shard statistics if found
- Useful for debugging shard-specific issues

**Important Notes:**
- Each shard is a separate process - no shared in-memory state between shards
- The auto-embed cache in `CrosshairCodeManager` is per-shard (not global)
- Restarting spawns all shards fresh
- Ready listener logs shard ID and guild count per shard

### Sapphire Framework Structure

The bot uses the **Sapphire Framework** which provides convention-based organization:

- **`src/commands/`** - Slash commands auto-registered via `@sapphire/framework`
  - Commands extend `Command` class
  - Use `@sapphire/plugin-subcommands` for complex commands

- **`src/listeners/`** - Discord event handlers auto-registered
  - Listeners extend `Listener` class
  - Event name specified via `event` property

- **Global Database Access** - Prisma client injected into Sapphire's `container`:
  ```typescript
  import { container } from '@sapphire/framework';
  const data = await container.prisma.autoEmbedChannel.findMany();
  ```

### Database Schema (Prisma)

**AutoEmbedChannel** - Channels where crosshair codes trigger auto-previews
- `channelId` (PK) - Can be channel, category, or grandparent category
- `guildId` - Discord server ID

**Gallery** - Forum channel configurations for crosshair galleries
- `channelId` (PK) - Discord forum channel ID
- `guildId` (unique) - One gallery per server
- `webhookId` (unique) - Webhook for posting gallery entries
- Relation: has many `GalleryEntry`

**GalleryEntry** - Individual crosshair submissions in gallery
- `channelId` (FK to Gallery) - Gallery channel
- `postId` (unique) - Discord forum thread ID
- `originalCode` - Full crosshair code string
- `hash` - SHA256 of normalized config (prevents duplicates)
- Unique constraint: `(channelId, hash)` - one code per gallery

**Migration Note:** This project recently migrated from MikroORM to Prisma. All old MikroORM files have been removed.

### Crosshair Code Processing

**`src/util/CrosshairUtil.ts`** - Core crosshair logic (~700 lines)

**Key Exports:**
- `testCode(code: string): boolean` - Validates crosshair code format
- `getCode(message: string): string | null` - Extracts code from message text
- `generateImage(code: string): Promise<Buffer>` - Renders PNG preview (9 backgrounds)
- `getConfiguration(code: string): CrosshairConfiguration` - Parses code into object
- `hashConfiguration(config: CrosshairConfiguration): string` - SHA256 hash for deduplication

**Crosshair Code Format:**
- Format: `0;[sections]` where sections are P (Primary), A (ADS), S (Sniper)
- Example: `0;P;c;1;...;A;c;1;...`
- Supports colors (8 presets + custom hex), inner/outer lines, dot, outlines, opacity, offsets

**Image Generation:**
- Uses Canvas library to draw crosshairs on 9 background images (`img/` directory)
- Supports Primary, ADS (Aim Down Sights), and Sniper crosshair variants
- Returns PNG buffer for Discord attachment

### Auto-Embed System

**`src/structures/managers/CrosshairCodeManager.ts`** - Singleton that handles message events

**Logic:**
1. Check if message is in auto-embed channel (or parent category, or grandparent category)
2. Extract crosshair code from message content
3. Validate code format
4. Check 5-minute in-memory cache to prevent duplicate embeds
5. Reply with generated preview image
6. Cache code for 5 minutes

**Hierarchical Channel Matching:**
- Direct channel match
- Parent category match (for threads/forums)
- Grandparent category match (for threads within forums in categories)

### Gallery System

**Gallery Setup Flow:**
1. Admin runs `/setup gallery set-channel <forum-channel>`
2. Bot validates forum channel type and permissions (SendMessages, SendMessagesInThreads, ManageWebhooks)
3. Bot creates webhook named "Crosshair" in that forum
4. Stores Gallery record with `channelId`, `guildId`, `webhookId`

**Publishing Flow:**
1. User runs `/crosshair publish <code>`
2. Bot validates code and checks for duplicate hash in gallery
3. Shows modal for crosshair name/description
4. Posts to forum via webhook (preserves user's identity)
5. Creates GalleryEntry with `postId` (thread ID), `originalCode`, `hash`

**Webhook Recovery:**
- `src/listeners/WebhooksUpdate.ts` detects deleted webhooks
- Auto-recreates webhook and updates `webhookId` in database
- Gallery continues functioning even if webhook manually deleted

**Deduplication:**
- Hash is computed from normalized configuration (ignores cosmetic differences)
- `(channelId, hash)` unique constraint prevents same crosshair published twice in same gallery

### Cleanup Listeners

**`src/listeners/GuildDelete.ts`** - Bot leaves server
- Deletes all `AutoEmbedChannel` for guild
- Deletes `Gallery` and cascades to all `GalleryEntry`

**`src/listeners/ChannelDelete.ts`** - Channel deleted
- Deletes `AutoEmbedChannel` if channel was configured
- Deletes `Gallery` and cascades if channel was gallery

**`src/listeners/ThreadDelete.ts`** - Forum thread deleted
- Deletes `GalleryEntry` where `postId` matches thread ID

## Import Aliases

Configured in `package.json` "imports" field:
- `#root/*` → `./dist/*.js`
- `#structures/*` → `./dist/structures/*.js`
- `#static/*` → `./static/*`

Always use these aliases in imports (they resolve to compiled JS in `dist/`).

## Code Patterns

### Accessing Prisma

```typescript
import { container } from '@sapphire/framework';

// Available everywhere after Bootstrap.login()
const channels = await container.prisma.autoEmbedChannel.findMany();
```

### Creating Commands

```typescript
import { Command } from '@sapphire/framework';
import { ApplicationCommandType } from 'discord.js';

export class MyCommand extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand(builder =>
            builder.setName('name').setDescription('desc')
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        // Command logic
    }
}
```

### Creating Listeners

```typescript
import { Listener } from '@sapphire/framework';
import type { Message } from 'discord.js';

export class MyListener extends Listener {
    public override async run(message: Message) {
        // Event logic
    }
}
```

## Important Notes

- The bot uses **Canvas** for image rendering - ensure system has required dependencies
- Crosshair codes are Valorant-specific format - do not modify validation regex without understanding format
- Gallery uses webhooks to preserve user identity when posting - never post directly as bot
- Auto-embed cache is in-memory (5 min TTL) - restarting bot clears cache
- One gallery per server enforced by unique constraint on `guildId`
