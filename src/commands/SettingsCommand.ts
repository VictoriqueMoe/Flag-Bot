import { Discord, Slash, SlashGroup, SlashOption } from "discordx";
import { injectable } from "tsyringe";
import { ApplicationCommandOptionType, CommandInteraction, PermissionsBitField } from "discord.js";
import { SettingsManager } from "../manager/SettingsManager.js";
import SETTING from "../model/enums/Settings.js";
import { replyOrFollowUp } from "../utils/Utils.js";

@Discord()
@SlashGroup({
    name: "settings",
    description: "Bot settings",
    dmPermission: false,
})
@SlashGroup("settings")
@injectable()
export class SettingsCommand {
    public constructor(private settingsManager: SettingsManager) {}

    @Slash({
        name: "role_auto_colour",
        defaultMemberPermissions: PermissionsBitField.Flags.Administrator,
        description: "Sets if the role the bot creates should inherit the national colour of the country",
    })
    private async roleColour(
        @SlashOption({
            name: "enabled",
            description: "Should this feature be enabled or disabled",
            required: true,
            type: ApplicationCommandOptionType.Boolean,
        })
        enabled: boolean,
        interaction: CommandInteraction,
    ): Promise<void> {
        await interaction.deferReply({
            ephemeral: true,
        });
        await this.saveOrUpdateSetting(SETTING.AUTO_ROLE_COLOUR, this.getBooleanValue(enabled), interaction);
    }

    @Slash({
        name: "role_prefix",
        defaultMemberPermissions: PermissionsBitField.Flags.Administrator,
        description: "enables or disables the role prefix prepended to roles",
    })
    private async rolePrefix(
        @SlashOption({
            name: "enabled",
            description: "Should this feature be enabled or disabled",
            required: true,
            type: ApplicationCommandOptionType.Boolean,
        })
        enabled: boolean,
        interaction: CommandInteraction,
    ): Promise<void> {
        await interaction.deferReply({
            ephemeral: true,
        });
        await this.saveOrUpdateSetting(SETTING.ROLE_PREFIX, this.getBooleanValue(enabled), interaction);
    }

    private async saveOrUpdateSetting(setting: SETTING, value: string, interaction: CommandInteraction): Promise<void> {
        try {
            await this.settingsManager.saveOrUpdateSetting(interaction.guildId!, setting, value);
        } catch (e) {
            console.error(e);
            return replyOrFollowUp(interaction, "Unable to update setting");
        }
        return replyOrFollowUp(interaction, "settings updated");
    }

    private getBooleanValue(b: boolean): string {
        return b ? "true" : "false";
    }
}
