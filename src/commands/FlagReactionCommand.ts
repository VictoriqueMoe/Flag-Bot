import {injectable} from "tsyringe";
import {ApplicationCommandMixin, Discord, Permission, SimpleCommandMessage, Slash, SlashOption} from "discordx";
import {ApplicationCommandPermissions, CommandInteraction, Guild, Permissions} from "discord.js";
import {InteractionUtils, ObjectUtil} from "../utils/Utils";
import {FlagManager} from "../model/manager/FlagManager";

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

    public constructor(private _flagManager: FlagManager) {
    }

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

    @Slash("makereport", {
        description: "generate csv report of all members of roles made by this bot"
    })
    private async makeReport(
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const reportMap = await this._flagManager.getReportMap(interaction.guildId);
        const csvMap: [string, number, string[]][] = [];
        for (const [role, members] of reportMap) {
            const memberArr = members.map(member => member.user.tag);
            csvMap.push([role.name, memberArr.length, memberArr]);
        }
        const csvStr = csvMap.map(s => s.join(",")).join("\r\n");
        if (!ObjectUtil.validString(csvStr)) {
            return InteractionUtils.replyOrFollowUp(interaction, "No data to generate");
        }
        const buf = Buffer.from(csvStr, 'utf8');
        interaction.editReply({
            content: "Report generated",
            files: [{
                attachment: buf,
                name: "report.csv"
            }]
        });
    }
}