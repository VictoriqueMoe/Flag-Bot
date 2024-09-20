import { Guild, GuildMember, Role } from "discord.js";
import { BotRoleManager } from "../../manager/BotRoleManager.js";
import { GuildManager } from "../../manager/GuildManager.js";
import { InteractionType } from "../../model/enums/InteractionType.js";
import { FlagModel } from "../../model/DB/guild/Flag.model.js";
import { AbstractFlagReactionEngine } from "./AbstractFlagReactionEngine.js";
import { injectable } from "tsyringe";
import { RestCountriesManager } from "../../manager/RestCountriesManager.js";
import { CountryInfo } from "../../model/typeings.js";
import { FlagRepo } from "../../db/repo/FlagRepo.js";
import { Builder } from "builder-pattern";
import SETTING from "../../model/enums/Settings.js";
import { SettingsManager } from "../../manager/SettingsManager.js";

@injectable()
export class CountryFlagEngine extends AbstractFlagReactionEngine {
    public constructor(
        restCountriesManager: RestCountriesManager,
        botRoleManager: BotRoleManager,
        guildManager: GuildManager,
        private repo: FlagRepo,
        private settingsManager: SettingsManager,
    ) {
        super(botRoleManager, guildManager, restCountriesManager);
    }

    public override get type(): InteractionType {
        return InteractionType.FLAG;
    }

    public override async handleReactionRemove(flagEmoji: string, guildMember: GuildMember): Promise<void> {
        const role = await this.getRoleFromFlag(flagEmoji, guildMember.guild.id);
        if (!role) {
            return;
        }
        try {
            await guildMember.roles.remove(role);
        } catch {
            return;
        }
        return super.handleReactionRemove(flagEmoji, guildMember);
    }

    /**
     * Get the role from the alpha code, will make a new role if one does not exist and will persist it
     * @param flagEmoji
     * @param guildId
     * @param addNew
     */
    public override async createRoleFromFlag(flagEmoji: string, guildId: string): Promise<Role | null> {
        const role = await this.getRoleFromFlag(flagEmoji, guildId);
        if (!role) {
            const guild = await this.guildManager.getGuild(guildId);
            const countryInfo = await this.restCountriesManager.getCountyLanguages(flagEmoji);
            if (!countryInfo) {
                return null;
            }
            return this.create(countryInfo, guild);
        }
        return role;
    }

    private async create(countryInfo: CountryInfo, guild: Guild): Promise<Role> {
        const botName = guild.members.me?.displayName ?? "flagBot";
        const shouldSetColour = await this.settingsManager.getSetting(guild.id, SETTING.AUTO_ROLE_COLOUR);
        const newRole = await guild.roles.create({
            name: countryInfo.name.common,
            reason: `Created via ${botName}`,
            color: shouldSetColour === "true" ? countryInfo.primaryColour : undefined,
        });
        const newModel = Builder(FlagModel, {
            alpha2Code: countryInfo.cca2,
            roleId: newRole.id,
            guildId: guild.id,
        });
        await this.repo.createEntry(newModel.build());
        return newRole;
    }

    protected override async hasDuplicateRoles(member: GuildMember): Promise<boolean> {
        const allRoles = await this.botRoleManager.getAllRolesFromDb(member.guild.id, InteractionType.FLAG);
        for (const roleInfo of allRoles) {
            if (member.roles.cache.has(roleInfo.role.id)) {
                return true;
            }
        }
        return false;
    }

    protected override async getRoleFromFlag(flagEmoji: string, guildId: string): Promise<Role | null> {
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

    public override async getReportMap(guildId: string): Promise<Map<Role, GuildMember[]>> {
        const guild = await this.guildManager.getGuild(guildId);
        const guildRoles = guild.roles.cache;
        const allRoles = await this.repo.getAllEntries(guildId);
        return super.buildReport(guildRoles, allRoles);
    }

    public async getCca2FromRole(guildId: string, roleId: string): Promise<string | null> {
        return (await this.repo.getEntryFromRole(guildId, roleId))?.alpha2Code ?? null;
    }
}
