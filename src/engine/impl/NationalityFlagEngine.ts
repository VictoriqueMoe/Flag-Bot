import { injectable } from "tsyringe";
import { AbstractFlagReactionEngine } from "./AbstractFlagReactionEngine.js";
import { Guild, GuildMember, Role } from "discord.js";
import { InteractionType } from "../../model/enums/InteractionType.js";
import { RestCountriesManager } from "../../manager/RestCountriesManager.js";
import { BotRoleManager } from "../../manager/BotRoleManager.js";
import { GuildManager } from "../../manager/GuildManager.js";
import { SettingsManager } from "../../manager/SettingsManager.js";
import { NationalityRepo } from "../../db/repo/NationalityRepo.js";
import { CountryInfo } from "../../model/typeings.js";
import { Builder } from "builder-pattern";
import { NationalityModel } from "../../model/DB/guild/Nationality.model.js";
import SETTING from "../../model/enums/Settings.js";

@injectable()
export class NationalityFlagEngine extends AbstractFlagReactionEngine<NationalityModel> {
    public constructor(
        restCountriesManager: RestCountriesManager,
        botRoleManager: BotRoleManager,
        guildManager: GuildManager,
        nationalityRepo: NationalityRepo,
        settingsManager: SettingsManager,
    ) {
        super(botRoleManager, guildManager, restCountriesManager, settingsManager, nationalityRepo);
    }

    public get type(): InteractionType {
        return InteractionType.NATIONALITY;
    }

    protected override async getRoleAndModel(
        countryInfo: CountryInfo,
        guild: Guild,
    ): Promise<[NationalityModel, Role]> {
        const botName = guild.members.me?.displayName ?? "flagBot";
        const shouldSetColour = await this.settingsManager.getSetting(guild.id, SETTING.AUTO_ROLE_COLOUR);

        const newRole = await guild.roles.create({
            name: `${await this.getRolePrefix(guild)}${countryInfo.demonym}`,
            reason: `Created via ${botName}`,
            color: shouldSetColour === "true" ? countryInfo.primaryColour : undefined,
        });

        const newModel = Builder(NationalityModel, {
            alpha2Code: countryInfo.cca2,
            roleId: newRole.id,
            guildId: guild.id,
        }).build();

        return [newModel, newRole];
    }

    private async getRolePrefix(guild: Guild): Promise<string> {
        const shouldUsePrefix = (await this.settingsManager.getSetting(guild.id, SETTING.ROLE_PREFIX)) === "true";
        return shouldUsePrefix ? "I am: " : "";
    }

    protected override async hasDuplicateRoles(member: GuildMember): Promise<boolean> {
        const allRoles = await this.botRoleManager.getAllRolesFromDb(member.guild.id, InteractionType.NATIONALITY);
        for (const roleInfo of allRoles) {
            if (member.roles.cache.has(roleInfo.role.id)) {
                return true;
            }
        }
        return false;
    }
}
