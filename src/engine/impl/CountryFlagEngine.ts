import { Guild, GuildMember, Role } from "discord.js";
import { Repository } from "typeorm";
import { BotRoleManager } from "../../manager/BotRoleManager.js";
import { GuildManager } from "../../manager/GuildManager.js";
import { InteractionType } from "../../model/enums/InteractionType.js";
import { FlagModel } from "../../model/DB/guild/Flag.model.js";
import { AbstractFlagReactionEngine } from "./AbstractFlagReactionEngine.js";
import { injectable } from "tsyringe";
import { RestCountriesManager } from "../../manager/RestCountriesManager.js";
import { CountryInfo } from "../../model/typeings.js";

@injectable()
export class CountryFlagEngine extends AbstractFlagReactionEngine {
    public constructor(
        restCountriesManager: RestCountriesManager,
        botRoleManager: BotRoleManager,
        guildManager: GuildManager,
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
            const guild = await this._guildManager.getGuild(guildId);
            const repo = this.ds.getRepository(FlagModel);
            const countryInfo = await this._restCountriesManager.getCountyLanguages(flagEmoji);
            if (!countryInfo) {
                return null;
            }
            return this.create(countryInfo, guild, repo);
        }
        return role;
    }

    private async create(countryInfo: CountryInfo, guild: Guild, repo: Repository<FlagModel>): Promise<Role> {
        const botName = guild.members.me?.displayName ?? "flagBot";
        const newRole = await guild.roles.create({
            name: countryInfo.name.common,
            reason: `Created via ${botName}`,
            color: countryInfo.primaryColour,
        });
        const newModel = DbUtils.build(FlagModel, {
            alpha2Code: countryInfo.cca2,
            roleId: newRole.id,
            guildId: guild.id,
        });
        await repo.save(newModel);
        return newRole;
    }

    protected override async hasDuplicateRoles(member: GuildMember): Promise<boolean> {
        const allRoles = await this._botRoleManager.getAllRolesFromDb(member.guild.id, InteractionType.FLAG);
        for (const roleInfo of allRoles) {
            if (member.roles.cache.has(roleInfo.role.id)) {
                return true;
            }
        }
        return false;
    }

    protected override async getRoleFromFlag(flagEmoji: string, guildId: string): Promise<Role | null> {
        const countryInfo = await this._restCountriesManager.getCountyLanguages(flagEmoji);
        const alpha2Code = countryInfo?.cca2;
        if (!alpha2Code) {
            return null;
        }
        const repo = this.ds.getRepository(FlagModel);
        const fromDb = await repo.findOne({
            select: ["roleId", "guildId"],
            where: {
                alpha2Code,
                guildId,
            },
        });
        const guild = await this._guildManager.getGuild(guildId);
        if (!fromDb) {
            return null;
        }
        const { roleId } = fromDb;
        return guild.roles.fetch(roleId);
    }

    public override async getReportMap(guildId: string): Promise<Map<Role, GuildMember[]>> {
        const repo = this.ds.getRepository(FlagModel);
        const guild = await this._guildManager.getGuild(guildId);
        const guildRoles = guild.roles.cache;
        const allRoles = await repo.find({
            where: {
                guildId,
            },
        });
        return super.buildReport(guildRoles, allRoles);
    }
}
