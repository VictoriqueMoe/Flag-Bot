import {BaseDAO} from "../../DAO/BaseDAO.js";
import {IFlagEngine} from "../IFlagEngine.js";
import {GuildMember, Role} from "discord.js";
import {InteractionType} from "../../model/enums/InteractionType.js";
import {ArrayUtils} from "../../utils/Utils.js";
import {BotRoleManager} from "../../manager/BotRoleManager.js";

export abstract class AbstractFlagReactionEngine extends BaseDAO implements IFlagEngine {

    protected constructor(protected _botRoleManager: BotRoleManager) {
        super();
    }

    public abstract get type(): InteractionType;

    public async handleReactionRemove(flagEmoji: string, guildMember: GuildMember): Promise<void> {
        const role = await this.createRoleFromFlag(flagEmoji, guildMember.guild.id, false);
        if (!role) {
            return;
        }
        try {
            await guildMember.roles.remove(role);
        } catch {
            return;
        }
        const usersWithRole = await this._botRoleManager.getUsersWithRole(guildMember.guild.id, role.id);
        if (!ArrayUtils.isValidArray(usersWithRole)) {
            await this._botRoleManager.removeRoleBinding(guildMember.guild.id, role.id);
        }
    }

    public abstract getReportMap(guildId: string): Promise<Map<Role, GuildMember[]>>;

    public abstract handleReactionAdd(guildMember: GuildMember, flagEmoji: string): Promise<void>;

    protected abstract createRoleFromFlag(flagEmoji: string, guildId: string, addNew: boolean): Promise<Role>;
}
