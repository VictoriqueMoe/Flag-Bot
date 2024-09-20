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
    private async setSetting(
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
        try {
            await this.settingsManager.saveOrUpdateSetting(
                interaction.guildId!,
                SETTING.AUTO_ROLE_COLOUR,
                enabled ? "true" : "false",
            );
        } catch (e) {
            console.error(e);
            return replyOrFollowUp(interaction, "Unable to update setting");
        }
        return replyOrFollowUp(interaction, "settings updated");
    }
}
