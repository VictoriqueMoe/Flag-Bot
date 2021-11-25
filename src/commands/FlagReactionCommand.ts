import {injectable} from "tsyringe";
import {ApplicationCommandMixin, Discord, Permission, SimpleCommandMessage, Slash, SlashOption} from "discordx";
import {ApplicationCommandPermissions, CommandInteraction, Guild, Permissions} from "discord.js";
import {InteractionUtils, ObjectUtil} from "../utils/Utils";

@Discord()
@Permission(false)
@Permission((guild: Guild, command: ApplicationCommandMixin | SimpleCommandMessage): ApplicationCommandPermissions[] => {
    const roles = guild.roles.cache;
    const adminRoles = roles.filter(role => {
        return role.permissions.has(Permissions.FLAGS.ADMINISTRATOR, true);
    });
    return adminRoles.map(allowedRole => {
        return {
            id: allowedRole.id,
            type: "ROLE",
            permission: true
        };
    });
})
@injectable()
export class FlagReactionCommand {

    @Slash("flagreact", {
        description: "set the initial flag reaction message"
    })
    private async flagReact(
        @SlashOption("custommessage", {
            description: "custom message to post with this command, leave blank for deault",
            required: false,
        })
            custom: string,
        interaction: CommandInteraction
    ): Promise<void> {
        if (ObjectUtil.validString(custom)) {
            return InteractionUtils.replyOrFollowUp(interaction, custom);
        }
        return InteractionUtils.replyOrFollowUp(interaction, "Please react with the flag of your country to get the role!");
    }
}