import {BaseDAO} from "../DAO/BaseDAO.js";
import {Discord} from "discordx";
import {injectable} from "tsyringe";
import {ArgsOf, On} from "discordx/build/esm/index.js";
import {BotRoleManager} from "../manager/BotRoleManager.js";

@Discord()
@injectable()
export class RoleEvents extends BaseDAO {
    public constructor(private _botRoleManager: BotRoleManager) {
        super();
    }

    @On()
    private async roleDelete([role]: ArgsOf<"roleDelete">): Promise<void> {
        const {id, guild} = role;
        try {
            await this._botRoleManager.removeRoleBinding(guild.id, id, false);
        } catch {

        }
    }
}
