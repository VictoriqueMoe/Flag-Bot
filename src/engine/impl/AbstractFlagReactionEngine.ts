import { IFlagEngine } from "../IFlagEngine.js";
import { Collection, Guild, GuildMember, Role } from "discord.js";
import { InteractionType } from "../../model/enums/InteractionType.js";
import { BotRoleManager } from "../../manager/BotRoleManager.js";
import { GuildManager } from "../../manager/GuildManager.js";
import { RestCountriesManager } from "../../manager/RestCountriesManager.js";
import { DupeRoleException } from "../../exceptions/DupeRoleException.js";
import { NoRolesFoundException } from "../../exceptions/NoRolesFoundException.js";
import { CountryInfo } from "../../model/typeings.js";
import { SettingsManager } from "../../manager/SettingsManager.js";
import { AbstractFlagRepo } from "../../db/repo/AbstractFlagRepo.js";
import { AbstractFlagModel } from "../../model/DB/guild/AbstractFlagModel.js";

export abstract class AbstractFlagReactionEngine<T extends AbstractFlagModel> implements IFlagEngine {
    protected constructor(
        protected botRoleManager: BotRoleManager,
        protected guildManager: GuildManager,
        protected restCountriesManager: RestCountriesManager,
        protected settingsManager: SettingsManager,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        private repo: AbstractFlagRepo<T, any>,
    ) {}

    public async handleReactionRemove(flagEmoji: string, guildMember: GuildMember): Promise<void> {
        const role = await this.getRoleFromFlag(flagEmoji, guildMember.guild.id);
        if (!role) {
            return;
        }
        try {
            await guildMember.roles.remove(role);
        } catch {
            return;
        }
        const usersWithRole = await this.botRoleManager.getUsersWithRole(guildMember.guild.id, role.id);
        if (usersWithRole.length === 0) {
            await this.botRoleManager.removeRoleBinding(guildMember.guild.id, role.id);
        }
    }

    private buildReport<T extends { roleId: string }>(
        guildRoles: Collection<string, Role>,
        roleModels: T[],
    ): Map<Role, GuildMember[]> {
        const reMap: Map<Role, GuildMember[]> = new Map();
        for (const flagRole of roleModels) {
            const role = guildRoles.get(flagRole.roleId);
            if (!role || role.members.size === 0) {
                continue;
            }
            const members = [...role.members.values()];
            if (reMap.has(role)) {
                reMap.get(role)!.push(...members);
            } else {
                reMap.set(role, members);
            }
        }
        return reMap;
    }

    public async handleReactionAdd(guildMember: GuildMember, flagEmoji: string): Promise<void> {
        const guildId = guildMember.guild.id;
        const role = await this.createRoleFromFlag(flagEmoji, guildId);
        if (!role) {
            throw new NoRolesFoundException();
        }
        if (await this.hasDuplicateRoles(guildMember, role)) {
            throw new DupeRoleException();
        }
        try {
            await guildMember.roles.add(role);
        } catch {
            /* empty */
        }
    }

    private async createRoleFromFlag(flagEmoji: string, guildId: string): Promise<Role | null> {
        const role = await this.getRoleFromFlag(flagEmoji, guildId);
        if (role) {
            // role already exists
            return role;
        }
        const guild = await this.guildManager.getGuild(guildId);
        const countryInfo = await this.restCountriesManager.getCountyLanguages(flagEmoji);
        if (!countryInfo) {
            return null;
        }

        const [newModel, newRole] = await this.getRoleAndModel(countryInfo, guild);
        await this.repo.createEntry(newModel);
        return newRole;
    }

    public async getCca2FromRole(guildId: string, roleId: string): Promise<string | null> {
        return (await this.repo.getEntryFromRole(guildId, roleId))?.alpha2Code ?? null;
    }

    public async getReportMap(guildId: string): Promise<Map<Role, GuildMember[]>> {
        const guild = await this.guildManager.getGuild(guildId);
        const guildRoles = guild.roles.cache;
        const allRoles = await this.repo.getAllEntries(guildId);
        return this.buildReport(guildRoles, allRoles);
    }

    protected async getRoleFromFlag(flagEmoji: string, guildId: string): Promise<Role | null> {
        const countryInfo = await this.restCountriesManager.getCountyLanguages(flagEmoji);
        const alpha2Code = countryInfo?.cca2;
        if (!alpha2Code) {
            return null;
        }

        const fromDb = await this.repo.getEntryFromAlpha2Code(guildId, alpha2Code);
        if (!fromDb) {
            return null;
        }
        const guild = await this.guildManager.getGuild(guildId);
        const { roleId } = fromDb;
        return guild.roles.fetch(roleId);
    }

    public abstract get type(): InteractionType;

    protected abstract hasDuplicateRoles(member: GuildMember, roleToCheck: Role): Promise<boolean>;

    protected abstract getRoleAndModel(countryInfo: CountryInfo, guild: Guild): Promise<[T, Role]>;
}
