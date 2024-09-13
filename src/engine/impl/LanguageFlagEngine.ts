import { InteractionType } from "../../model/enums/InteractionType.js";
import { Guild, GuildMember, MessageReaction, Role } from "discord.js";
import { RestCountriesManager } from "../../manager/RestCountriesManager.js";
import { CountryManager } from "../../manager/CountryManager.js";
import { BotRoleManager } from "../../manager/BotRoleManager.js";
import { GuildManager } from "../../manager/GuildManager.js";
import { DbUtils, ObjectUtil } from "../../utils/Utils.js";
import { LanguageModel } from "../../model/DB/guild/Language.model.js";
import { Repository } from "typeorm";
import { CountryLanguage } from "../../model/typeings.js";
import { AbstractFlagReactionEngine } from "./AbstractFlagReactionEngine.js";
import { injectable } from "tsyringe";
import { DupeRoleException } from "../../exceptions/DupeRoleException.js";
import { NoRolesFoundException } from "../../exceptions/NoRolesFoundException.js";

@injectable()
export class LanguageFlagEngine extends AbstractFlagReactionEngine {
    public constructor(
        restCountriesManager: RestCountriesManager,
        countryManager: CountryManager,
        botRoleManager: BotRoleManager,
        guildManager: GuildManager,
    ) {
        super(botRoleManager, guildManager, restCountriesManager, countryManager);
    }

    public get type(): InteractionType {
        return InteractionType.LANGUAGE;
    }

    public override async handleReactionRemove(
        flagEmoji: string,
        guildMember: GuildMember,
        reaction?: MessageReaction,
    ): Promise<void> {
        const role = await this.getRoleFromFlag(flagEmoji, guildMember.guild.id);
        if (!role) {
            return;
        }
        try {
            const roleName = role.name;
            const reactedMessage = reaction!.message;
            const reactionEmoji = reactedMessage.reactions.cache;
            let hasOtherLang = false;
            for (const [, otherReaction] of reactionEmoji) {
                const users = await otherReaction.users.fetch();
                if (!users.has(guildMember.id)) {
                    continue;
                }
                const reactionName = otherReaction.emoji.name;
                if (!reactionName) {
                    continue;
                }
                const roleFromEmoji = await this.getRoleFromFlag(reactionName, guildMember.guild.id);
                if (roleFromEmoji && roleFromEmoji.name === roleName) {
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
        const role = await this.createRoleFromFlag(flagEmoji, guildId);
        if (!role) {
            throw new NoRolesFoundException();
        }
        if (this.hasDupes(guildMember, role)) {
            throw new DupeRoleException();
        }
        try {
            await guildMember.roles.add(role);
        } catch {
            /* empty */
        }
    }

    public override async createRoleFromFlag(flagEmoji: string, guildId: string): Promise<Role | null> {
        const role = await this.getRoleFromFlag(flagEmoji, guildId);
        if (!role) {
            const alpha2Code = this._countryManager.getAlpha2Code(flagEmoji);
            if (!alpha2Code) {
                return null;
            }
            const languages = this._restCountriesManager.getCountyLanguages(alpha2Code);
            const repo = this.ds.getRepository(LanguageModel);
            const guild = await this._guildManager.getGuild(guildId);
            const lang = languages[0];
            return this.create(lang, guild, repo);
        }
        return role;
    }

    private async create(lang: CountryLanguage, guild: Guild, repo: Repository<LanguageModel>): Promise<Role> {
        const botName = guild.members.me?.displayName ?? "FlagBot";
        const newRole = await guild.roles.create({
            name: lang.name,
            reason: `Created via ${botName}`,
        });
        const newModel = DbUtils.build(LanguageModel, {
            roleId: newRole.id,
            guildId: guild.id,
            languageName: lang.name,
            languageCode: lang.code,
        });
        await repo.save(newModel);
        return newRole;
    }

    private hasDupes(member: GuildMember, roleToCheck: Role): boolean {
        return ObjectUtil.isValidObject(member.roles.cache.find(role => role.name === roleToCheck.name));
    }
}
