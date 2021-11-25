import {BaseDAO} from "../../DAO/BaseDAO";
import {Guild, Role} from "discord.js";
import {Repository, Transaction, TransactionRepository} from "typeorm";
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
        let fromDb = await repo.findOne({
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
        const newGuild = await guild.roles.create({
            name: country,
            reason: `Created via ${botName}`
        });
        const newModel = BaseDAO.build(FlagModel, {
            alpha2Code,
            roleId: newGuild.id,
            guildId: guild.id
        });
        await super.commitToDatabase(repo, [newModel]);
        return newGuild;
    }

    public getCountryFromFlag(flag: string): string {
        const unicode = "U+" + emojiUnicode(flag).toUpperCase().split(" ").join(" U+")
        for (const countryData of countryFlagEmoji.list) {
            if (countryData.unicode === unicode) {
                return countryData.code;
            }
        }
        return null;
    }
}