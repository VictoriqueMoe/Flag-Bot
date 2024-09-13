import { type ArgsOf, Discord, On } from "discordx";
import { injectable } from "tsyringe";
import { OnReady } from "./OnReady.js";
import { BaseDAO } from "../DAO/BaseDAO.js";
import { GuildableModel } from "../model/DB/guild/Guildable.model.js";
import { DbUtils } from "../utils/Utils.js";

@Discord()
@injectable()
export class BotGuildUpdater extends BaseDAO {
    public constructor(private _onReady: OnReady) {
        super();
    }

    @On()
    private async guildCreate([guild]: ArgsOf<"guildCreate">): Promise<void> {
        const model = DbUtils.build(GuildableModel, {
            guildId: guild.id,
        });
        await this.ds.manager.save(GuildableModel, model);
        return this._onReady
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
        await this.ds.getRepository(GuildableModel).delete({
            guildId: guild.id,
        });
    }
}
