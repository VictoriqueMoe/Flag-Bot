import {ArgsOf, Discord, On, Slash, SlashOption} from "discordx";
import {ApplicationCommandOptionType, CommandInteraction, Message, PermissionsBitField} from "discord.js";
import {injectable} from "tsyringe";
import {FlagManager} from "../model/manager/FlagManager.js";
import {InteractionFlagModel} from "../model/DB/guild/InteractionFlag.model.js";
import {InteractionUtils, ObjectUtil} from "../utils/Utils.js";
import {BaseDAO} from "../DAO/BaseDAO.js";
import {InteractionType} from "../model/enums/InteractionType.js";
import {Repository} from "typeorm/repository/Repository.js";

@Discord()
@injectable()

export class FlagReactionCommand extends BaseDAO {

    public constructor(private _flagManager: FlagManager) {
        super();
    }

    @On()
    private async messageDelete([message]: ArgsOf<"messageDelete">): Promise<void> {
        const messageId = message.id;
        const repo = this.ds.getRepository(InteractionFlagModel);
        if (message.author.id !== message.guild.members.me.id) {
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


    private async checkNoDupeMessages(repo: Repository<unknown>, type: InteractionType, interaction: CommandInteraction): Promise<boolean> {
        const count = await repo.count({
            where: {
                guildId: interaction.guildId,
                type: type
            }
        });
        if (count !== 0) {
            setTimeout(() => {
                interaction.deleteReply();
            }, 4000);
            const cmd = type === InteractionType.FLAG ? "flag_react" : "language_react";
            await InteractionUtils.replyOrFollowUp(interaction, `Only one "${cmd}" can exist at one time`);
            return true;
        }
        return false;
    }

    @Slash({
        description: "set the initial language reaction message",
        name: "language_react",
        defaultMemberPermissions: PermissionsBitField.Flags.Administrator
    })
    private async languageReact(
        @SlashOption({
            name: "custom_message",
            description: "custom message to post with this command, leave blank for default",
            required: false,
            type: ApplicationCommandOptionType.String,
        })
            custom: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        const repo = this.ds.getRepository(InteractionFlagModel);
        const hasDupe = await this.checkNoDupeMessages(repo, InteractionType.LANGUAGE, interaction);
        if (hasDupe) {
            return;
        }
        const messageReply = await interaction.followUp({
            fetchReply: true,
            content: ObjectUtil.validString(custom) ? custom : "Please react with the flag of a country to get the role of the primary language of the country!"
        });
        if (!(messageReply instanceof Message)) {
            return InteractionUtils.replyOrFollowUp(interaction, "unknown error occurred");
        }
        try {
            await messageReply.channel.messages.fetch({
                message: messageReply.id,
                force: true,
                cache: true
            });
        } catch {
            return InteractionUtils.replyOrFollowUp(interaction, "I am not allowed to post/see messages in this channel");
        }
        try {
            await repo.insert({
                guildId: interaction.guildId,
                messageId: messageReply.id,
                channelId: messageReply.channelId,
                type: InteractionType.LANGUAGE
            });
        } catch {
            return InteractionUtils.replyOrFollowUp(interaction, "unknown error occurred");
        }
    }

    @Slash({
        description: "set the initial flag reaction message",
        name: "flag_react",
        defaultMemberPermissions: PermissionsBitField.Flags.Administrator
    })
    private async flagReact(
        @SlashOption({
            name: "custom_message",
            description: "custom message to post with this command, leave blank for default",
            required: false,
            type: ApplicationCommandOptionType.String,
        })
            custom: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        const repo = this.ds.getRepository(InteractionFlagModel);
        const hasDupe = await this.checkNoDupeMessages(repo, InteractionType.FLAG, interaction);
        if (hasDupe) {
            return;
        }
        const messageReply = await interaction.followUp({
            fetchReply: true,
            content: ObjectUtil.validString(custom) ? custom : "Please react with the flag of your country to get the role!"
        });
        if (!(messageReply instanceof Message)) {
            return InteractionUtils.replyOrFollowUp(interaction, "unknown error occurred");
        }
        try {
            await messageReply.channel.messages.fetch({
                message: messageReply.id,
                force: true,
                cache: true
            });
        } catch {
            return InteractionUtils.replyOrFollowUp(interaction, "I am not allowed to post/see messages in this channel");
        }

        try {
            await repo.insert({
                guildId: interaction.guildId,
                messageId: messageReply.id,
                channelId: messageReply.channelId,
                type: InteractionType.FLAG
            });
        } catch {
            return InteractionUtils.replyOrFollowUp(interaction, "unknown error occurred");
        }
    }

    @Slash({
        name: "make_report",
        defaultMemberPermissions: PermissionsBitField.Flags.Administrator,
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
