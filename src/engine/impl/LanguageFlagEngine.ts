import { InteractionType } from "../../model/enums/InteractionType.js";
import { Guild, GuildMember, MessageReaction, Role } from "discord.js";
import { RestCountriesManager } from "../../manager/RestCountriesManager.js";
import { BotRoleManager } from "../../manager/BotRoleManager.js";
import { GuildManager } from "../../manager/GuildManager.js";
import { DbUtils, ObjectUtil } from "../../utils/Utils.js";
import { LanguageModel } from "../../model/DB/guild/Language.model.js";
import { Repository } from "typeorm";
import { CountryInfo } from "../../model/typeings.js";
import { AbstractFlagReactionEngine } from "./AbstractFlagReactionEngine.js";
import { injectable } from "tsyringe";

@injectable()
export class LanguageFlagEngine extends AbstractFlagReactionEngine {
    public constructor(
        restCountriesManager: RestCountriesManager,
        botRoleManager: BotRoleManager,
        guildManager: GuildManager,
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
            const countryInfo = await this._restCountriesManager.getCountyLanguages(flagEmoji);
            if (!countryInfo) {
                return null;
            }
            const repo = this.ds.getRepository(LanguageModel);
            const guild = await this._guildManager.getGuild(guildId);
            return this.create(countryInfo, guild, repo);
        }
        return role;
    }

    private async create(countryInfo: CountryInfo, guild: Guild, repo: Repository<LanguageModel>): Promise<Role> {
        const lang = countryInfo.languageInfo[0];
        const botName = guild.members.me?.displayName ?? "FlagBot";
        const newRole = await guild.roles.create({
            name: lang.name,
            reason: `Created via ${botName}`,
            color: countryInfo.primaryColour,
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

    protected override hasDuplicateRoles(member: GuildMember, roleToCheck: Role): Promise<boolean> {
        return Promise.resolve(
            ObjectUtil.isValidObject(member.roles.cache.find(role => role.name === roleToCheck.name)),
        );
    }

    protected override async getRoleFromFlag(flagEmoji: string, guildId: string): Promise<Role | null> {
        const countryInfo = await this._restCountriesManager.getCountyLanguages(flagEmoji!);
        if (!countryInfo) {
            return null;
        }
        const repo = this.ds.getRepository(LanguageModel);
        const lang = countryInfo.languageInfo[0];
        const languageCode = lang.code;
        const fromDb = await repo.findOneBy({
            languageCode,
            guildId,
        });
        if (!fromDb) {
            return null;
        }
        const guild = await this._guildManager.getGuild(guildId);
        const { roleId } = fromDb;
        return guild.roles.fetch(roleId);
    }

    public override async getReportMap(guildId: string): Promise<Map<Role, GuildMember[]>> {
        const repo = this.ds.getRepository(LanguageModel);
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
