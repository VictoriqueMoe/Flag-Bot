import {InteractionType} from "../../model/enums/InteractionType.js";
import {Guild, GuildMember, MessageReaction, Role} from "discord.js";
import {RestCountriesManager} from "../../manager/RestCountriesManager.js";
import {CountryManager} from "../../manager/CountryManager.js";
import {BotRoleManager} from "../../manager/BotRoleManager.js";
import {GuildManager} from "../../manager/GuildManager.js";
import {DbUtils, ObjectUtil} from "../../utils/Utils.js";
import {LanguageModel} from "../../model/DB/guild/Language.model.js";
import {Repository} from "typeorm";
import {CountryLanguage} from "../../model/typeings.js";
import {AbstractFlagReactionEngine} from "./AbstractFlagReactionEngine.js";
import {injectable} from "tsyringe";
import {DupeRoleException} from "../../exceptions/DupeRoleException.js";
import {NoRolesFoundException} from "../../exceptions/NoRolesFoundException.js";

@injectable()
export class LanguageFlagEngine extends AbstractFlagReactionEngine {

    public constructor(private _restCountriesManager: RestCountriesManager,
                       private _countryManager: CountryManager,
                       botRoleManager: BotRoleManager,
                       private _guildManager: GuildManager) {
        super(botRoleManager);
    }

    public get type(): InteractionType {
        return InteractionType.LANGUAGE;
    }

    public override async handleReactionRemove(flagEmoji: string, guildMember: GuildMember, reaction?: MessageReaction): Promise<void> {
        const role = await this.createRoleFromFlag(flagEmoji, guildMember.guild.id, false);
        if (!role) {
            return;
        }
        try {
            const roleName = role.name;
            const reactedMessage = reaction.message;
            const reactionEmoji = reactedMessage.reactions.cache;
            let hasOtherLang = false;
            for (const [, otherReaction] of reactionEmoji) {
                const users = await otherReaction.users.fetch();
                if (!users.has(guildMember.id)) {
                    continue;
                }
                const reactionName = otherReaction.emoji.name;
                const roleFromEmoji = await this.createRoleFromFlag(reactionName, guildMember.guild.id, false);
                if (roleFromEmoji.name === roleName) {
                    hasOtherLang = true;
                    break;
                }
            }
            if (!hasOtherLang) {
                await guildMember.roles.remove(role);
            }
        } catch {
            return;
        }
        return super.handleReactionRemove(flagEmoji, guildMember);
    }

    public override async handleReactionAdd(guildMember: GuildMember, flagEmoji: string): Promise<void> {
        const guildId = guildMember.guild.id;
        const role = await this.createRoleFromFlag(flagEmoji, guildId, true);
        if (this._hasDupes(guildMember, role)) {
            throw new DupeRoleException();
        }
        if (!role) {
            throw new NoRolesFoundException();
        }
        try {
            await guildMember.roles.add(role);
        } catch {

        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public override getReportMap(guildId: string): Promise<Map<Role, GuildMember[]>> {
        // not implemented yet
        return Promise.resolve(new Map());
    }

    public override async createRoleFromFlag(flagEmoji: string, guildId: string, addNew: boolean): Promise<Role> {
        const alpha2Code = this._countryManager.getAlpha2Code(flagEmoji);
        if (!ObjectUtil.validString(alpha2Code)) {
            return null;
        }
        const languages = await this._restCountriesManager.getCountyLanguages(alpha2Code);
        if (languages.length !== 1) {
            throw new Error("Unable to use a country that speaks more than one language");
        }

        const repo = this.ds.getRepository(LanguageModel);
        const lang = languages[0];
        const languageCode = lang.code;

        const fromDb = await repo.findOneBy({
            languageCode,
            guildId
        });
        const guild = await this._guildManager.getGuild(guildId);
        if (!ObjectUtil.isValidObject(fromDb)) {
            if (addNew) {
                return this.create(lang, guild, repo);
            }
            return null;
        }
        const {roleId} = fromDb;
        return guild.roles.fetch(roleId);
    }

    private async create(lang: CountryLanguage, guild: Guild, repo: Repository<LanguageModel>): Promise<Role> {
        const botName = guild.members.me.displayName;
        const newRole = await guild.roles.create({
            name: lang.name,
            reason: `Created via ${botName}`
        });
        const newModel = DbUtils.build(LanguageModel, {
            roleId: newRole.id,
            guildId: guild.id,
            languageName: lang.name,
            languageCode: lang.code
        });
        await repo.save(newModel);
        return newRole;
    }

    private _hasDupes(member: GuildMember, roleToCheck: Role): boolean {
        return ObjectUtil.isValidObject(member.roles.cache.find(role => role.name === roleToCheck.name));
    }

}
