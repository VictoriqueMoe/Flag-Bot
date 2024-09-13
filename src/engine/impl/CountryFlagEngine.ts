import countries from "i18n-iso-countries";
import { Guild, GuildMember, Role } from "discord.js";
import { Repository } from "typeorm";
import { BotRoleManager } from "../../manager/BotRoleManager.js";
import { GuildManager } from "../../manager/GuildManager.js";
import { CountryManager } from "../../manager/CountryManager.js";
import { DbUtils } from "../../utils/Utils.js";
import { InteractionType } from "../../model/enums/InteractionType.js";
import { FlagModel } from "../../model/DB/guild/Flag.model.js";
import { AbstractFlagReactionEngine } from "./AbstractFlagReactionEngine.js";
import { injectable } from "tsyringe";
import { NoRolesFoundException } from "../../exceptions/NoRolesFoundException.js";
import { DupeRoleException } from "../../exceptions/DupeRoleException.js";
import { RestCountriesManager } from "../../manager/RestCountriesManager.js";

@injectable()
export class CountryFlagEngine extends AbstractFlagReactionEngine {
    public constructor(
        restCountriesManager: RestCountriesManager,
        countryManager: CountryManager,
        botRoleManager: BotRoleManager,
        guildManager: GuildManager,
    ) {
        super(botRoleManager, guildManager, restCountriesManager, countryManager);
    }

    public override get type(): InteractionType {
        return InteractionType.FLAG;
    }

    public override async handleReactionAdd(guildMember: GuildMember, flagEmoji: string): Promise<void> {
        const guildId = guildMember.guild.id;
        if (await this.hasDupes(guildMember)) {
            throw new DupeRoleException();
        }
        const role = await this.createRoleFromFlag(flagEmoji, guildId);
        if (!role) {
            throw new NoRolesFoundException();
        }
        try {
            await guildMember.roles.add(role);
        } catch {
            /* empty */
        }
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
            const alpha2Code = this._countryManager.getAlpha2Code(flagEmoji);
            if (!alpha2Code) {
                return null;
            }
            const guild = await this._guildManager.getGuild(guildId);
            const repo = this.ds.getRepository(FlagModel);
            return this.create(alpha2Code, guild, repo);
        }
        return role;
    }

    private async create(alpha2Code: string, guild: Guild, repo: Repository<FlagModel>): Promise<Role> {
        const country = countries.getName(alpha2Code, "en");
        const botName = guild.members.me?.displayName ?? "flagBot";
        const newRole = await guild.roles.create({
            name: country,
            reason: `Created via ${botName}`,
        });
        const newModel = DbUtils.build(FlagModel, {
            alpha2Code,
            roleId: newRole.id,
            guildId: guild.id,
        });
        await repo.save(newModel);
        return newRole;
    }

    private async hasDupes(member: GuildMember): Promise<boolean> {
        const allRoles = await this._botRoleManager.getAllRolesFromDb(member.guild.id, InteractionType.FLAG);
        for (const role of allRoles) {
            if (member.roles.cache.has(role.id)) {
                return true;
            }
        }
        return false;
    }

    protected override async getRoleFromFlag(flagEmoji: string, guildId: string): Promise<Role | null> {
        const alpha2Code = this._countryManager.getAlpha2Code(flagEmoji);
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
}
