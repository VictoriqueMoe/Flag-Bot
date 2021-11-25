import {injectable} from "tsyringe";
import {
    ApplicationCommandMixin,
    ArgsOf,
    Client,
    Discord,
    On,
    Permission,
    SimpleCommandMessage,
    Slash,
    SlashOption
} from "discordx";
import {ApplicationCommandPermissions, CommandInteraction, Guild, Message, Permissions} from "discord.js";
import {InteractionUtils, ObjectUtil} from "../utils/Utils";
import {FlagManager} from "../model/manager/FlagManager";
import {getRepository} from "typeorm";
import {InteractionFlagModel} from "../model/DB/guild/InteractionFlag.model";

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

    @On("messageDelete")
    private async messageDeleted([message]: ArgsOf<"messageDelete">, client: Client): Promise<void> {
        const messageId = message.id;
        const repo = getRepository(InteractionFlagModel);
        if (message.author.id !== message.guild.me.id) {
            return;
        }
        try {
            await repo.delete({
                messageId,
                guildId: message.guildId
            });
        } catch {

        }
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
        await interaction.deferReply();
        const repo = getRepository(InteractionFlagModel);
        const count = await repo.count({
            where: {
                guildId: interaction.guildId
            }
        });
        if (count !== 0) {
            setTimeout(args => {
                interaction.deleteReply();
            }, 4000);
            return InteractionUtils.replyOrFollowUp(interaction, "Only one `/flagreact` can exist at one time");
        }
        const messageReply = await interaction.followUp({
            fetchReply: true,
            content: ObjectUtil.validString(custom) ? custom : "Please react with the flag of your country to get the role!"
        });
        if (!(messageReply instanceof Message)) {
            return InteractionUtils.replyOrFollowUp(interaction, "unknown error occurred");
        }

        try {
            await repo.insert({
                guildId: interaction.guildId,
                messageId: messageReply.id
            });
        } catch {
            return InteractionUtils.replyOrFollowUp(interaction, "unknown error occurred");
        }
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