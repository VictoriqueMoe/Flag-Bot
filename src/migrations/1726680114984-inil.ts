import { MigrationInterface, QueryRunner } from "typeorm";

export class Inil1726680114984 implements MigrationInterface {
    name = 'Inil1726680114984'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "nationality_model" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "guildId" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "alpha2Code" varchar NOT NULL, "roleId" varchar NOT NULL, CONSTRAINT "uniqueIndex" UNIQUE ("alpha2Code", "roleId", "guildId"))`);
        await queryRunner.query(`CREATE TABLE "language_model" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "guildId" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "alpha2Code" varchar NOT NULL, "roleId" varchar NOT NULL, "languageCode" varchar NOT NULL, CONSTRAINT "uniqueIndex" UNIQUE ("roleId", "guildId", "languageCode"))`);
        await queryRunner.query(`CREATE TABLE "flag_model" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "guildId" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "alpha2Code" varchar NOT NULL, "roleId" varchar NOT NULL, CONSTRAINT "uniqueIndex" UNIQUE ("alpha2Code", "roleId", "guildId"))`);
        await queryRunner.query(`CREATE TABLE "guildable_model" ("guildId" varchar PRIMARY KEY NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "interaction_flag_model" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "guildId" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "messageId" varchar NOT NULL, "channelId" varchar NOT NULL, "type" integer NOT NULL DEFAULT (0), CONSTRAINT "uniqueConstraint" UNIQUE ("guildId", "type"))`);
        await queryRunner.query(`CREATE TABLE "temporary_nationality_model" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "guildId" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "alpha2Code" varchar NOT NULL, "roleId" varchar NOT NULL, CONSTRAINT "uniqueIndex" UNIQUE ("alpha2Code", "roleId", "guildId"), CONSTRAINT "FK_2629fe8766c0dbe288fe18051a7" FOREIGN KEY ("guildId") REFERENCES "guildable_model" ("guildId") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_nationality_model"("id", "guildId", "createdAt", "updatedAt", "alpha2Code", "roleId") SELECT "id", "guildId", "createdAt", "updatedAt", "alpha2Code", "roleId" FROM "nationality_model"`);
        await queryRunner.query(`DROP TABLE "nationality_model"`);
        await queryRunner.query(`ALTER TABLE "temporary_nationality_model" RENAME TO "nationality_model"`);
        await queryRunner.query(`CREATE TABLE "temporary_language_model" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "guildId" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "alpha2Code" varchar NOT NULL, "roleId" varchar NOT NULL, "languageCode" varchar NOT NULL, CONSTRAINT "uniqueIndex" UNIQUE ("roleId", "guildId", "languageCode"), CONSTRAINT "FK_314a40ecb54553cc00b8de0b870" FOREIGN KEY ("guildId") REFERENCES "guildable_model" ("guildId") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_language_model"("id", "guildId", "createdAt", "updatedAt", "alpha2Code", "roleId", "languageCode") SELECT "id", "guildId", "createdAt", "updatedAt", "alpha2Code", "roleId", "languageCode" FROM "language_model"`);
        await queryRunner.query(`DROP TABLE "language_model"`);
        await queryRunner.query(`ALTER TABLE "temporary_language_model" RENAME TO "language_model"`);
        await queryRunner.query(`CREATE TABLE "temporary_flag_model" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "guildId" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "alpha2Code" varchar NOT NULL, "roleId" varchar NOT NULL, CONSTRAINT "uniqueIndex" UNIQUE ("alpha2Code", "roleId", "guildId"), CONSTRAINT "FK_0440aefc28add7e223780ee509d" FOREIGN KEY ("guildId") REFERENCES "guildable_model" ("guildId") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_flag_model"("id", "guildId", "createdAt", "updatedAt", "alpha2Code", "roleId") SELECT "id", "guildId", "createdAt", "updatedAt", "alpha2Code", "roleId" FROM "flag_model"`);
        await queryRunner.query(`DROP TABLE "flag_model"`);
        await queryRunner.query(`ALTER TABLE "temporary_flag_model" RENAME TO "flag_model"`);
        await queryRunner.query(`CREATE TABLE "temporary_interaction_flag_model" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "guildId" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "messageId" varchar NOT NULL, "channelId" varchar NOT NULL, "type" integer NOT NULL DEFAULT (0), CONSTRAINT "uniqueConstraint" UNIQUE ("guildId", "type"), CONSTRAINT "FK_d0562cf5e1da31c0be7fcb9b704" FOREIGN KEY ("guildId") REFERENCES "guildable_model" ("guildId") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_interaction_flag_model"("id", "guildId", "createdAt", "updatedAt", "messageId", "channelId", "type") SELECT "id", "guildId", "createdAt", "updatedAt", "messageId", "channelId", "type" FROM "interaction_flag_model"`);
        await queryRunner.query(`DROP TABLE "interaction_flag_model"`);
        await queryRunner.query(`ALTER TABLE "temporary_interaction_flag_model" RENAME TO "interaction_flag_model"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "interaction_flag_model" RENAME TO "temporary_interaction_flag_model"`);
        await queryRunner.query(`CREATE TABLE "interaction_flag_model" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "guildId" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "messageId" varchar NOT NULL, "channelId" varchar NOT NULL, "type" integer NOT NULL DEFAULT (0), CONSTRAINT "uniqueConstraint" UNIQUE ("guildId", "type"))`);
        await queryRunner.query(`INSERT INTO "interaction_flag_model"("id", "guildId", "createdAt", "updatedAt", "messageId", "channelId", "type") SELECT "id", "guildId", "createdAt", "updatedAt", "messageId", "channelId", "type" FROM "temporary_interaction_flag_model"`);
        await queryRunner.query(`DROP TABLE "temporary_interaction_flag_model"`);
        await queryRunner.query(`ALTER TABLE "flag_model" RENAME TO "temporary_flag_model"`);
        await queryRunner.query(`CREATE TABLE "flag_model" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "guildId" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "alpha2Code" varchar NOT NULL, "roleId" varchar NOT NULL, CONSTRAINT "uniqueIndex" UNIQUE ("alpha2Code", "roleId", "guildId"))`);
        await queryRunner.query(`INSERT INTO "flag_model"("id", "guildId", "createdAt", "updatedAt", "alpha2Code", "roleId") SELECT "id", "guildId", "createdAt", "updatedAt", "alpha2Code", "roleId" FROM "temporary_flag_model"`);
        await queryRunner.query(`DROP TABLE "temporary_flag_model"`);
        await queryRunner.query(`ALTER TABLE "language_model" RENAME TO "temporary_language_model"`);
        await queryRunner.query(`CREATE TABLE "language_model" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "guildId" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "alpha2Code" varchar NOT NULL, "roleId" varchar NOT NULL, "languageCode" varchar NOT NULL, CONSTRAINT "uniqueIndex" UNIQUE ("roleId", "guildId", "languageCode"))`);
        await queryRunner.query(`INSERT INTO "language_model"("id", "guildId", "createdAt", "updatedAt", "alpha2Code", "roleId", "languageCode") SELECT "id", "guildId", "createdAt", "updatedAt", "alpha2Code", "roleId", "languageCode" FROM "temporary_language_model"`);
        await queryRunner.query(`DROP TABLE "temporary_language_model"`);
        await queryRunner.query(`ALTER TABLE "nationality_model" RENAME TO "temporary_nationality_model"`);
        await queryRunner.query(`CREATE TABLE "nationality_model" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "guildId" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "alpha2Code" varchar NOT NULL, "roleId" varchar NOT NULL, CONSTRAINT "uniqueIndex" UNIQUE ("alpha2Code", "roleId", "guildId"))`);
        await queryRunner.query(`INSERT INTO "nationality_model"("id", "guildId", "createdAt", "updatedAt", "alpha2Code", "roleId") SELECT "id", "guildId", "createdAt", "updatedAt", "alpha2Code", "roleId" FROM "temporary_nationality_model"`);
        await queryRunner.query(`DROP TABLE "temporary_nationality_model"`);
        await queryRunner.query(`DROP TABLE "interaction_flag_model"`);
        await queryRunner.query(`DROP TABLE "guildable_model"`);
        await queryRunner.query(`DROP TABLE "flag_model"`);
        await queryRunner.query(`DROP TABLE "language_model"`);
        await queryRunner.query(`DROP TABLE "nationality_model"`);
    }

}
