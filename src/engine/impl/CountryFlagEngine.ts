import { Guild, GuildMember, Role } from "discord.js";
import { BotRoleManager } from "../../manager/BotRoleManager.js";
import { GuildManager } from "../../manager/GuildManager.js";
import { InteractionType } from "../../model/enums/InteractionType.js";
import { FlagModel } from "../../model/DB/guild/Flag.model.js";
import { AbstractFlagReactionEngine } from "./AbstractFlagReactionEngine.js";
import { injectable } from "tsyringe";
import { RestCountriesManager } from "../../manager/RestCountriesManager.js";
import { CountryInfo } from "../../model/typeings.js";
import { FlagRepo } from "../../db/repo/FlagRepo.js";
import { Builder } from "builder-pattern";
import { SettingsManager } from "../../manager/SettingsManager.js";
import SETTING from "../../model/enums/Settings.js";

@injectable()
export class CountryFlagEngine extends AbstractFlagReactionEngine<FlagModel> {
    public constructor(
        restCountriesManager: RestCountriesManager,
        botRoleManager: BotRoleManager,
        guildManager: GuildManager,
        flagRepo: FlagRepo,
        settingsManager: SettingsManager,
    ) {
        super(botRoleManager, guildManager, restCountriesManager, settingsManager, flagRepo);
    }

    public override get type(): InteractionType {
        return InteractionType.FLAG;
    }

    protected override async getRoleAndModel(countryInfo: CountryInfo, guild: Guild): Promise<[FlagModel, Role]> {
        const botName = guild.members.me?.displayName ?? "flagBot";
        const shouldSetColour = await this.settingsManager.getSetting(guild.id, SETTING.AUTO_ROLE_COLOUR);
        const newRole = await guild.roles.create({
            name: `${await this.getRolePrefix(guild)}${countryInfo.name.common}`,
            reason: `Created via ${botName}`,
            color: shouldSetColour === "true" ? countryInfo.primaryColour : undefined,
        });
        const model = Builder(FlagModel, {
            alpha2Code: countryInfo.cca2,
            roleId: newRole.id,
            guildId: guild.id,
        }).build();

        return [model, newRole];
    }

    private async getRolePrefix(guild: Guild): Promise<string> {
        const shouldUsePrefix = (await this.settingsManager.getSetting(guild.id, SETTING.ROLE_PREFIX)) === "true";
        return shouldUsePrefix ? "I live in: " : "";
    }

    protected override async hasDuplicateRoles(member: GuildMember): Promise<boolean> {
        const allRoles = await this.botRoleManager.getAllRolesFromDb(member.guild.id, InteractionType.FLAG);
        for (const roleInfo of allRoles) {
            if (member.roles.cache.has(roleInfo.role.id)) {
                return true;
            }
        }
        return false;
    }
}
