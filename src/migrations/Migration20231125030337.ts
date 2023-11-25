import { Migration } from '@mikro-orm/migrations';

export class Migration20231125030337 extends Migration {
    public override async up(): Promise<void> {
        this.addSql('create table `auto_embed_channel` (`channel_id` varchar(255) not null comment \'The channel snowflake\', `guild_id` varchar(255) not null comment \'The guild snowflake\', primary key (`channel_id`)) default character set utf8mb4 engine = InnoDB;');
    }

    public override async down(): Promise<void> {
        this.addSql('drop table if exists `auto_embed_channel`;');
    }
}
