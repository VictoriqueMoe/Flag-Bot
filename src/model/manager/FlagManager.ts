import {BaseDAO} from "../../DAO/BaseDAO";
import {Guild, GuildMember, Role} from "discord.js";
import {getRepository, Repository, Transaction, TransactionRepository} from "typeorm";
import {ObjectUtil} from "../../utils/Utils";
import {singleton} from "tsyringe";
import {GuildManager} from "./GuildManager";
import countries from "i18n-iso-countries";
import {FlagModel} from "../DB/guild/Flag.model";
import emojiUnicode from "emoji-unicode";
import countryFlagEmoji from "country-flag-emoji";

@singleton()
export class FlagManager extends BaseDAO<FlagModel> {

    public constructor(private _guildManager: GuildManager) {
        super();
    }

    public async getReportMap(guildId: string): Promise<Map<Role, GuildMember[]>> {
        const repo = getRepository(FlagModel);
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

    public async getAllRolesFromDb(guildId: string): Promise<Role[]> {
        const guild = await this._guildManager.getGuild(guildId);
        const repo = getRepository(FlagModel);
        const allRoles = await repo.find({
            where: {
                guildId
            }
        });
        const retArr: Role[] = [];
        for (const role of allRoles) {
            const guildRole = guild.roles.cache.get(role.roleId);
            if (!guildRole) {
                await this.removeRoleBinding(guildId, role.roleId, false);
                continue;
            }
            retArr.push(guildRole);
        }
        return retArr;
    }

    public async getUsersWithRole(guildId: string, roleId: string): Promise<GuildMember[]> {
        const guild = await this._guildManager.getGuild(guildId);
        const role = guild.roles.cache.get(roleId);
        if (!role) {
            return [];
        }
        return [...role.members.values()];
    }

    public async removeRoleBinding(guildId: string, roleId: string, propagateToGuild: boolean = true): Promise<boolean> {
        const repo = getRepository(FlagModel);
        const deletedData = await repo.delete({
            guildId,
            roleId
        });
        const didDelete = deletedData.affected === 1;
        if (didDelete && propagateToGuild) {
            const guild = await this._guildManager.getGuild(guildId);
            const role = guild.roles.cache.get(roleId);
            try {
                await role.delete("no more members with role");
            } catch {
                return false;
            }
            return true;
        }
        return !propagateToGuild && didDelete;

    }

    /**
     * Get the role from the alpha code, will make a new role if one does not exist and will persist it
     * @param flagEmoji
     * @param guildId
     * @param repo
     * @param addNew
     */
    @Transaction()
    public async getRoleFromAlpha2Code(flagEmoji: string, guildId: string, addNew: boolean, @TransactionRepository(FlagModel) repo?: Repository<FlagModel>): Promise<Role> {
        const alpha2Code = this.getCountryFromFlag(flagEmoji);
        if (!ObjectUtil.validString(alpha2Code)) {
            return null;
        }
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
        const botName = guild.me.displayName;
        const newRole = await guild.roles.create({
            name: country,
            reason: `Created via ${botName}`
        });
        const newModel = BaseDAO.build(FlagModel, {
            alpha2Code,
            roleId: newRole.id,
            guildId: guild.id
        });
        await super.commitToDatabase(repo, [newModel]);
        return newRole;
    }

    private getCountryFromFlag(flag: string): string {
        const unicode = "U+" + emojiUnicode(flag).toUpperCase().split(" ").join(" U+");
        for (const countryData of countryFlagEmoji.list) {
            if (countryData.unicode === unicode) {
                return countryData.code;
            }
        }
        return null;
    }
}