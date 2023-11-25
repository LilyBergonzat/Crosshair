import { TSMigrationGenerator } from '@mikro-orm/migrations';
import { IMigrationGenerator } from '@mikro-orm/core';

export class MigrationGenerator extends TSMigrationGenerator implements IMigrationGenerator {
    public override generateMigrationFile(className: string, diff: { up: string[]; down: string[] }): string {
        let ret = `import { Migration } from '@mikro-orm/migrations';\n\n`;

        ret += `export class ${className} extends Migration {\n`;
        ret += `    public override async up(): Promise<void> {\n`;
        diff.up.forEach(sql => ret += this.createStatement(sql, 8));
        ret += `    }\n\n`;

        if (diff.down.length > 0) {
            ret += `    public override async down(): Promise<void> {\n`;
            diff.down.forEach(sql => ret += this.createStatement(sql, 8));
            ret += `    }\n`;
        }

        ret += `}\n`;

        return ret;
    }
}
