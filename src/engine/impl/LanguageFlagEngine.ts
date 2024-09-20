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
export class LanguageFlagEngine extends AbstractFlagReactionEngine {
    public constructor(
        restCountriesManager: RestCountriesManager,
        botRoleManager: BotRoleManager,
        guildManager: GuildManager,
        private languageRepo: LanguageRepo,
        private settingsManager: SettingsManager,
    ) {
        super(botRoleManager, guildManager, restCountriesManager);
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

    public override async createRoleFromFlag(flagEmoji: string, guildId: string): Promise<Role | null> {
        const role = await this.getRoleFromFlag(flagEmoji, guildId);
        if (!role) {
            const countryInfo = await this.restCountriesManager.getCountyLanguages(flagEmoji);
            if (!countryInfo) {
                return null;
            }
            const guild = await this.guildManager.getGuild(guildId);
            return this.create(countryInfo, guild);
        }
        return role;
    }

    private async create(countryInfo: CountryInfo, guild: Guild): Promise<Role> {
        const lang = countryInfo.languageInfo[0];
        const botName = guild.members.me?.displayName ?? "FlagBot";
        const shouldSetColour = await this.settingsManager.getSetting(guild.id, SETTING.AUTO_ROLE_COLOUR);

        const newRole = await guild.roles.create({
            name: lang.name,
            reason: `Created via ${botName}`,
            color: shouldSetColour === "true" ? countryInfo.primaryColour : undefined,
        });
        const newModel = Builder(LanguageModel, {
            roleId: newRole.id,
            guildId: guild.id,
            languageCode: lang.code,
            alpha2Code: countryInfo.cca2,
        });

        await this.languageRepo.createEntry(newModel.build());
        return newRole;
    }

    protected override hasDuplicateRoles(member: GuildMember, roleToCheck: Role): Promise<boolean> {
        return Promise.resolve(
            ObjectUtil.isValidObject(member.roles.cache.find(role => role.name === roleToCheck.name)),
        );
    }

    protected override async getRoleFromFlag(flagEmoji: string, guildId: string): Promise<Role | null> {
        const countryInfo = await this.restCountriesManager.getCountyLanguages(flagEmoji!);
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

    public override async getReportMap(guildId: string): Promise<Map<Role, GuildMember[]>> {
        const guild = await this.guildManager.getGuild(guildId);
        const guildRoles = guild.roles.cache;
        const allLanguages = await this.languageRepo.getAllEntries(guildId);
        return super.buildReport(guildRoles, allLanguages);
    }

    public async getCca2FromRole(guildId: string, roleId: string): Promise<string | null> {
        return (await this.languageRepo.getEntryFromRole(guildId, roleId))?.alpha2Code ?? null;
    }
}
