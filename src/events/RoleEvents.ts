import { type ArgsOf, Discord, On } from "discordx";
import { injectable } from "tsyringe";
import { BotRoleManager } from "../manager/BotRoleManager.js";

@Discord()
@injectable()
export class RoleEvents {
    public constructor(private _botRoleManager: BotRoleManager) {}

    @On()
    private async roleDelete([role]: ArgsOf<"roleDelete">): Promise<void> {
        const { id, guild } = role;
        try {
            await this._botRoleManager.removeRoleBinding(guild.id, id, false);
        } catch {
            /* empty */
        }
    }
}
