import {BaseDAO} from "../../DAO/BaseDAO.js";
import {singleton} from "tsyringe";
import {Client} from "discordx";
import {Guild} from "discord.js";
import {GuildableModel} from "../DB/guild/Guildable.model.js";

@singleton()
export class GuildManager extends BaseDAO {

    public constructor(private _client: Client) {
        super();
    }

    public async getGuilds(): Promise<Guild[]> {
        const retArray: Guild[] = [];
        const models = await this.ds.getRepository(GuildableModel).find();
        for (const model of models) {
            const guild = await this._client.guilds.fetch(model.guildId);
            retArray.push(guild);
        }
        return retArray;
    }

    public getGuild(guildId: string): Promise<Guild | null> {
        return this._client.guilds.fetch(guildId);
    }

}
