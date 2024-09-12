import { BaseDAO } from "../DAO/BaseDAO.js";
import { singleton } from "tsyringe";
import { Client } from "discordx";
import { Guild } from "discord.js";
import { GuildableModel } from "../model/DB/guild/Guildable.model.js";

@singleton()
export class GuildManager extends BaseDAO {
    public constructor(private _client: Client) {
        super();
    }

    public async getGuilds(): Promise<Guild[]> {
        const models = await this.ds.getRepository(GuildableModel).find();
        return Promise.all(models.map(model => this._client.guilds.fetch(model.guildId)));
    }

    public getGuild(guildId: string): Promise<Guild> {
        return this._client.guilds.fetch(guildId);
    }
}
