import { singleton } from "tsyringe";
import { GuildableModel } from "../../model/DB/guild/Guildable.model.js";
import { GuildDao } from "../dao/GuildDao.js";
import { Collection, Guild, Snowflake } from "discord.js";
import { Builder } from "builder-pattern";

@singleton()
export class GuildRepo {
    public constructor(private dao: GuildDao) {}

    public getAllGuilds(): Promise<GuildableModel[]> {
        return this.dao.getAllGuilds();
    }

    public saveGuild(model: GuildableModel): Promise<GuildableModel> {
        return this.dao.saveGuild(model);
    }

    public removeGuild(guildId: string): Promise<boolean> {
        return this.dao.removeGuild(guildId);
    }

    public populateGuilds(guilds: Collection<Snowflake, Guild>): Promise<void> {
        return this.dao.dataSource.transaction(async entityManager => {
            for (const [guildId] of guilds) {
                const hasGuild = await this.dao.hasGuild(guildId, entityManager);
                if (!hasGuild) {
                    const newGuild = Builder(GuildableModel, {
                        guildId,
                    }).build();
                    await this.dao.saveGuild(newGuild, entityManager);
                }
            }
        });
    }

    public hasGuild(guildId: string): Promise<boolean> {
        return this.dao.hasGuild(guildId);
    }

    public getGuild(guildId: string): Promise<GuildableModel | null> {
        return this.dao.getGuild(guildId);
    }
}
