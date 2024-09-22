import { singleton } from "tsyringe";
import { GuildMember, Role } from "discord.js";
import { GuildManager } from "./GuildManager.js";
import { InteractionType } from "../model/enums/InteractionType.js";
import { ModelTypeMapping } from "../model/typeings.js";
import { LanguageRepo } from "../db/repo/LanguageRepo.js";
import { FlagRepo } from "../db/repo/FlagRepo.js";
import { NationalityRepo } from "../db/repo/NationalityRepo.js";
import { FlagModel } from "../model/DB/guild/Flag.model.js";
import { LanguageModel } from "../model/DB/guild/Language.model.js";
import { NationalityModel } from "../model/DB/guild/Nationality.model.js";

@singleton()
export class BotRoleManager {
    public constructor(
        private guildManager: GuildManager,
        private languageRepo: LanguageRepo,
        private flagRepo: FlagRepo,
        private nationalityRepo: NationalityRepo,
    ) {}

    public async getAllRolesFromDb<K extends InteractionType>(
        guildId: string,
        type: K,
    ): Promise<{ role: Role; dbRole: ModelTypeMapping[K] }[]> {
        const guild = await this.guildManager.getGuild(guildId);
        let allModels: FlagModel | LanguageModel | NationalityModel[] = [];

        switch (type) {
            case InteractionType.FLAG:
                allModels = await this.flagRepo.getAllEntries(guildId);
                break;
            case InteractionType.LANGUAGE:
                allModels = await this.languageRepo.getAllEntries(guildId);
                break;
            case InteractionType.NATIONALITY:
                allModels = await this.nationalityRepo.getAllEntries(guildId);
                break;
        }

        const retArr: { role: Role; dbRole: ModelTypeMapping[K] }[] = [];
        for (const model of allModels) {
            const guildRole = guild.roles.cache.get(model.roleId);
            if (!guildRole) {
                await this.removeRoleBinding(guildId, model.roleId, false);
                continue;
            }
            retArr.push({
                role: guildRole,
                dbRole: model as ModelTypeMapping[K],
            });
        }
        return retArr;
    }

    public async removeRoleBinding(guildId: string, roleId: string, propagateToGuild = true): Promise<boolean> {
        const removedLanguage = await this.languageRepo.removeEntry(guildId, roleId);
        const removedFLag = await this.flagRepo.removeEntry(guildId, roleId);
        const removedNationality = await this.nationalityRepo.removeEntry(guildId, roleId);
        const didDelete = removedLanguage || removedFLag || removedNationality;
        if (didDelete && propagateToGuild) {
            const guild = await this.guildManager.getGuild(guildId);
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
        const guild = await this.guildManager.getGuild(guildId);
        const fetchedRole = await guild.roles.fetch(roleId, {
            force: true,
        });
        if (!fetchedRole) {
            return [];
        }
        return [...fetchedRole.members.values()];
    }
}
