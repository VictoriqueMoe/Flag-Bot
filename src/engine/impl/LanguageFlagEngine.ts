import { InteractionType } from "../../model/enums/InteractionType.js";
import { Guild, GuildMember, MessageReaction, Role } from "discord.js";
import { RestCountriesManager } from "../../manager/RestCountriesManager.js";
import { BotRoleManager } from "../../manager/BotRoleManager.js";
import { GuildManager } from "../../manager/GuildManager.js";
import { ObjectUtil } from "../../utils/Utils.js";
import { LanguageModel } from "../../model/DB/guild/Language.model.js";
import { CountryInfo } from "../../model/typeings.js";
import { AbstractFlagReactionEngine } from "./AbstractFlagReactionEngine.js";
import { injectable } from "tsyringe";
import { LanguageRepo } from "../../db/repo/LanguageRepo.js";
import { Builder } from "builder-pattern";
import { SettingsManager } from "../../manager/SettingsManager.js";
import SETTING from "../../model/enums/Settings.js";

@injectable()
export class LanguageFlagEngine extends AbstractFlagReactionEngine<LanguageModel> {
    public constructor(
        restCountriesManager: RestCountriesManager,
        botRoleManager: BotRoleManager,
        guildManager: GuildManager,
        private languageRepo: LanguageRepo,
        settingsManager: SettingsManager,
    ) {
        super(botRoleManager, guildManager, restCountriesManager, settingsManager, languageRepo);
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
        const roleName = role.name;
        let hasOtherLang = false;
        if (reaction) {
            const reactedMessage = reaction.message;
            const reactionEmoji = reactedMessage.reactions.cache;
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
        }

        if (!hasOtherLang) {
            await guildMember.roles.remove(role);
        }
        await super.clearRoleBinding(guildMember, role);
    }

    protected override async getRoleAndModel(countryInfo: CountryInfo, guild: Guild): Promise<[LanguageModel, Role]> {
        const lang = countryInfo.languageInfo[0];
        const botName = guild.members.me?.displayName ?? "flagBot";
        const shouldSetColour = await this.settingsManager.getSetting(guild.id, SETTING.AUTO_ROLE_COLOUR);
        const newRole = await guild.roles.create({
            name: `${await this.getRolePrefix(guild)}${lang.name}`,
            reason: `Created via ${botName}`,
            color: shouldSetColour === "true" ? countryInfo.primaryColour : undefined,
        });
        const newModel = Builder(LanguageModel, {
            roleId: newRole.id,
            guildId: guild.id,
            languageCode: lang.code,
            alpha2Code: countryInfo.cca2,
        }).build();

        return [newModel, newRole];
    }

    private async getRolePrefix(guild: Guild): Promise<string> {
        const shouldUsePrefix = (await this.settingsManager.getSetting(guild.id, SETTING.ROLE_PREFIX)) === "true";
        return shouldUsePrefix ? "I speak: " : "";
    }

    protected override hasDuplicateRoles(member: GuildMember, roleToCheck: Role): Promise<boolean> {
        return Promise.resolve(
            ObjectUtil.isValidObject(member.roles.cache.find(role => role.name === roleToCheck.name)),
        );
    }

    protected override async getRoleFromFlag(flagEmoji: string, guildId: string): Promise<Role | null> {
        const countryInfo = await this.restCountriesManager.getCountyLanguages(flagEmoji);
        if (!countryInfo) {
            return null;
        }
        const lang = countryInfo.languageInfo[0];
        const languageCode = lang.code;
        const fromDb = await this.languageRepo.getLanguageByGuildId(languageCode, guildId);
        if (!fromDb) {
            return null;
        }
        const guild = await this.guildManager.getGuild(guildId);
        const { roleId } = fromDb;
        return guild.roles.fetch(roleId);
    }
}
