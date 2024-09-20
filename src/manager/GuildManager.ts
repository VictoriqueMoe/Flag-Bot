import { singleton } from "tsyringe";
import { Client } from "discordx";
import { Guild } from "discord.js";
import { GuildRepo } from "../db/repo/GuildRepo.js";

@singleton()
export class GuildManager {
    public constructor(
        private client: Client,
        private guildRepo: GuildRepo,
    ) {}

    public async getGuilds(): Promise<Guild[]> {
        const models = await this.guildRepo.getAllGuilds();
        return Promise.all(models.map(model => this.client.guilds.fetch(model.guildId)));
    }

    public getGuild(guildId: string): Promise<Guild> {
        return this.client.guilds.fetch(guildId);
    }
}
