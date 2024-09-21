import { type ArgsOf, Discord, On } from "discordx";
import { injectable } from "tsyringe";
import { OnReady } from "./OnReady.js";
import { GuildableModel } from "../model/DB/guild/Guildable.model.js";
import { Builder } from "builder-pattern";
import { GuildRepo } from "../db/repo/GuildRepo.js";

@Discord()
@injectable()
export class BotGuildUpdater {
    public constructor(
        private onReady: OnReady,
        private guildRepo: GuildRepo,
    ) {}

    @On()
    private async guildCreate([guild]: ArgsOf<"guildCreate">): Promise<void> {
        const model = Builder(GuildableModel, {
            guildId: guild.id,
        });
        await this.guildRepo.saveGuild(model.build());
        return this.onReady
            .init()
            .then(() => {
                console.info(`Joined server "${guild.name}"`);
            })
            .catch(e => {
                console.error(e);
            });
    }

    @On()
    private async guildDelete([guild]: ArgsOf<"guildDelete">): Promise<void> {
        console.info(`Bot left guild: "${guild.name}" deleting all related data...`);
        await this.guildRepo.removeGuild(guild.id);
    }
}
