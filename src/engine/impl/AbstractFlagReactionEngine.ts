import {BaseDAO} from "../../DAO/BaseDAO.js";
import {IFlagEngine} from "../IFlagEngine.js";
import {GuildMember, Role} from "discord.js";
import {InteractionType} from "../../model/enums/InteractionType.js";
import {ArrayUtils} from "../../utils/Utils.js";
import {BotRoleManager} from "../../manager/BotRoleManager.js";
import {FlagModel} from "../../model/DB/guild/Flag.model.js";
import {GuildManager} from "../../manager/GuildManager.js";

export abstract class AbstractFlagReactionEngine extends BaseDAO implements IFlagEngine {

    protected constructor(protected _botRoleManager: BotRoleManager,
                          protected _guildManager: GuildManager) {
        super();
    }

    public abstract get type(): InteractionType;

    public async handleReactionRemove(flagEmoji: string, guildMember: GuildMember): Promise<void> {
        const role = await this.createRoleFromFlag(flagEmoji, guildMember.guild.id, false);
        const usersWithRole = await this._botRoleManager.getUsersWithRole(guildMember.guild.id, role.id);
        if (!ArrayUtils.isValidArray(usersWithRole)) {
            await this._botRoleManager.removeRoleBinding(guildMember.guild.id, role.id);
        }
    }

    public async getReportMap(guildId: string): Promise<Map<Role, GuildMember[]>> {
        const repo = this.ds.getRepository(FlagModel);
        const guild = await this._guildManager.getGuild(guildId);
        const guildRoles = guild.roles.cache;
        const allRoles = await repo.find({
            where: {
                guildId
            }
        });
        const reMap: Map<Role, GuildMember[]> = new Map();
        for (const flagRole of allRoles) {
            const role = guildRoles.get(flagRole.roleId);
            if (role.members.size === 0) {
                continue;
            }
            const members = [...role.members.values()];
            if (reMap.has(role)) {
                reMap.get(role).push(...members);
            } else {
                reMap.set(role, members);
            }
        }
        return reMap;
    }

    public abstract handleReactionAdd(guildMember: GuildMember, flagEmoji: string): Promise<void>;

    protected abstract createRoleFromFlag(flagEmoji: string, guildId: string, addNew: boolean): Promise<Role>;
}
