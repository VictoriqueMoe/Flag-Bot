import countries from "i18n-iso-countries";
import {Guild, GuildMember, Role} from "discord.js";
import {Repository} from "typeorm";
import {BotRoleManager} from "../../manager/BotRoleManager.js";
import {GuildManager} from "../../manager/GuildManager.js";
import {CountryManager} from "../../manager/CountryManager.js";
import {DbUtils, ObjectUtil} from "../../utils/Utils.js";
import {InteractionType} from "../../model/enums/InteractionType.js";
import {FlagModel} from "../../model/DB/guild/Flag.model.js";
import {AbstractFlagReactionEngine} from "./AbstractFlagReactionEngine.js";

export class CountryFlagEngine extends AbstractFlagReactionEngine {

    public constructor(private _guildManager: GuildManager,
                       private _countryManager: CountryManager,
                       botRoleManager: BotRoleManager) {
        super(botRoleManager);
    }

    public override get type(): InteractionType {
        return InteractionType.FLAG;
    }

    public override async handleReactionAdd(guildMember: GuildMember, flagEmoji: string): Promise<void> {
        const guildId = guildMember.guild.id;
        if (await this._hasDupes(guildMember)) {
            throw new DupeRoleException();
        }
        const role = await this.createRoleFromFlag(flagEmoji, guildId, true);
        if (!role) {
            throw new NoRolesFoundException();
        }
        try {
            await guildMember.roles.add(role);
        } catch {

        }
    }

    public override async getReportMap(guildId: string): Promise<Map<Role, GuildMember[]>> {
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


    /**
     * Get the role from the alpha code, will make a new role if one does not exist and will persist it
     * @param flagEmoji
     * @param guildId
     * @param addNew
     */
    public override async createRoleFromFlag(flagEmoji: string, guildId: string, addNew: boolean): Promise<Role> {
        const alpha2Code = this._countryManager.getAlpha2Code(flagEmoji);
        if (!ObjectUtil.validString(alpha2Code)) {
            return null;
        }
        const repo = this.ds.getRepository(FlagModel);
        const fromDb = await repo.findOne({
            select: ["roleId", "guildId"],
            where: {
                alpha2Code,
                guildId
            }
        });
        const guild = await this._guildManager.getGuild(guildId);
        if (!ObjectUtil.isValidObject(fromDb)) {
            if (addNew) {
                return this.create(alpha2Code, guild, repo);
            }
            return null;
        }
        const {roleId} = fromDb;
        return guild.roles.fetch(roleId);
    }

    private async create(alpha2Code: string, guild: Guild, repo: Repository<FlagModel>): Promise<Role> {
        const country = countries.getName(alpha2Code, "en");
        const botName = guild.members.me.displayName;
        const newRole = await guild.roles.create({
            name: country,
            reason: `Created via ${botName}`
        });
        const newModel = DbUtils.build(FlagModel, {
            alpha2Code,
            roleId: newRole.id,
            guildId: guild.id
        });
        await repo.save(newModel);
        return newRole;
    }

    private async _hasDupes(member: GuildMember): Promise<boolean> {
        const allRoles = await this._botRoleManager.getAllRolesFromDb(member.guild.id, InteractionType.FLAG);
        for (const role of allRoles) {
            if (member.roles.cache.has(role.id)) {
                return true;
            }
        }
        return false;
    }
}

export class DupeRoleException extends Error {
    public constructor() {
        super();
    }
}

export class NoRolesFoundException extends Error {
    public constructor() {
        super();
    }
}