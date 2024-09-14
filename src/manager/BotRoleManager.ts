import { singleton } from "tsyringe";
import { GuildMember, Role } from "discord.js";
import { FlagModel } from "../model/DB/guild/Flag.model.js";
import { GuildManager } from "./GuildManager.js";
import { InteractionType } from "../model/enums/InteractionType.js";
import { BaseDAO } from "../DAO/BaseDAO.js";
import { LanguageModel } from "../model/DB/guild/Language.model.js";
import { Repository } from "typeorm/repository/Repository.js";

@singleton()
export class BotRoleManager extends BaseDAO {
    public constructor(private _guildManager: GuildManager) {
        super();
    }

    public async getAllRolesFromDb(
        guildId: string,
        type: InteractionType,
    ): Promise<{ role: Role; dbRole: LanguageModel | FlagModel }[]> {
        const guild = await this._guildManager.getGuild(guildId);
        const repo = this.getRepo(type);
        const allRoles = await repo.find({
            where: {
                guildId,
            },
        });
        const retArr: { role: Role; dbRole: LanguageModel | FlagModel }[] = [];
        for (const role of allRoles) {
            const guildRole = guild.roles.cache.get(role.roleId);
            if (!guildRole) {
                await this.removeRoleBinding(guildId, role.roleId, false);
                continue;
            }
            retArr.push({
                role: guildRole,
                dbRole: role,
            });
        }
        return retArr;
    }

    public async removeRoleBinding(guildId: string, roleId: string, propagateToGuild = true): Promise<boolean> {
        const languageRepo = this.getRepo(InteractionType.LANGUAGE);
        const flagRepo = this.getRepo(InteractionType.FLAG);
        const langDeletedData = await languageRepo.delete({
            guildId,
            roleId,
        });
        const flagDeletedData = await flagRepo.delete({
            guildId,
            roleId,
        });
        const didDelete = langDeletedData.affected === 1 || flagDeletedData.affected === 1;
        if (didDelete && propagateToGuild) {
            const guild = await this._guildManager.getGuild(guildId);
            let role: Role | null | undefined = guild.roles.cache.get(roleId);
            if (!role) {
                role = await guild.roles.fetch(roleId);
            }
            if (!role) {
                return false;
            }
            try {
                await role.delete("no more members with role");
            } catch {
                return false;
            }
            return true;
        }
        return !propagateToGuild && didDelete;
    }

    public async getUsersWithRole(guildId: string, roleId: string): Promise<GuildMember[]> {
        const guild = await this._guildManager.getGuild(guildId);
        const role = guild.roles.cache.get(roleId);
        if (!role) {
            return [];
        }
        const fetchedRole = await guild.roles.fetch(role.id, {
            force: true,
            cache: true,
        });
        if (!fetchedRole) {
            return [];
        }
        return [...fetchedRole.members.values()];
    }

    private getRepo(type: InteractionType): Repository<LanguageModel | FlagModel> {
        if (type === InteractionType.LANGUAGE) {
            return this.ds.getRepository(LanguageModel);
        }
        return this.ds.getRepository(FlagModel);
    }
}
