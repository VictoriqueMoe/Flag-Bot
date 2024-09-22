import { type ArgsOf, Discord, On, Slash, SlashChoice, SlashOption } from "discordx";
import { ApplicationCommandOptionType, CommandInteraction, PermissionsBitField } from "discord.js";
import { injectable } from "tsyringe";
import { ObjectUtil, replyOrFollowUp } from "../utils/Utils.js";
import { asString, InteractionType } from "../model/enums/InteractionType.js";
import { FlagManager } from "../manager/FlagManager.js";
import { InteractionRepo } from "../db/repo/InteractionRepo.js";
import { Builder } from "builder-pattern";
import { InteractionFlagModel } from "../model/DB/guild/InteractionFlag.model.js";

@Discord()
@injectable()
export class FlagReactionCommand {
    public constructor(
        private flagManager: FlagManager,
        private interactionRepo: InteractionRepo,
    ) {}

    @On()
    private async messageDelete([message]: ArgsOf<"messageDelete">): Promise<void> {
        const messageId = message.id;
        if (message.author?.id !== message?.guild?.members?.me?.id) {
            return;
        }
        const guildId = message.guildId;
        if (guildId) {
            const reactionEmoji = message.reactions.cache;
            for (const [, reaction] of reactionEmoji) {
                const emoji = reaction.emoji;
                if (!emoji.name) {
                    continue;
                }
                const interaction = await this.interactionRepo.getInteraction(guildId, messageId);
                if (!interaction) {
                    continue;
                }
                const type = interaction.type;
                const engine = this.flagManager.getEngineFromType(type);
                if (!engine) {
                    continue;
                }
                const members = reaction.users.cache;
                for (const [userId] of members) {
                    const guildMember = message.guild?.members.resolve(userId);
                    if (guildMember) {
                        await engine.handleReactionRemove(emoji.name, guildMember);
                    }
                }
            }
            try {
                await this.interactionRepo.deleteInteraction(guildId, messageId);
            } catch {
                /* empty */
            }
        }
    }

    private async checkNoDupeMessages(type: InteractionType, interaction: CommandInteraction): Promise<boolean> {
        if (!interaction.guildId) {
            return false;
        }
        const exists = await this.interactionRepo.interactionExists(interaction.guildId, type);
        if (exists) {
            setTimeout(() => {
                interaction.deleteReply();
            }, 4000);
            await replyOrFollowUp(interaction, `Only one "${asString(type)}" can exist at one time`);
            return true;
        }
        return false;
    }

    @Slash({
        name: "flag",
        defaultMemberPermissions: PermissionsBitField.Flags.Administrator,
        description: "Create a new flag reaction message",
    })
    private async flag(
        @SlashChoice({ name: "Language", value: InteractionType.LANGUAGE })
        @SlashChoice({ name: "Residence", value: InteractionType.FLAG })
        @SlashChoice({ name: "Nationality", value: InteractionType.NATIONALITY })
        @SlashOption({
            name: "type",
            description: "What type of flag reaction do you want to make?",
            required: true,
            type: ApplicationCommandOptionType.Number,
        })
        type: InteractionType,
        @SlashOption({
            name: "custom_message",
            description: "custom message to post with this command, leave blank for default",
            required: false,
            type: ApplicationCommandOptionType.String,
        })
        custom: string,
        interaction: CommandInteraction,
    ): Promise<void> {
        await interaction.deferReply();
        const hasDupe = await this.checkNoDupeMessages(type, interaction);
        if (hasDupe) {
            return;
        }

        let defaultMessage = "";
        switch (type) {
            case InteractionType.LANGUAGE:
                defaultMessage = "Please react with the flag of your country to get the role of your spoken language!";
                break;
            case InteractionType.NATIONALITY:
                defaultMessage = "Please react with the flag of your country to get the role of your nationality!";
                break;
            case InteractionType.FLAG:
                defaultMessage =
                    "Please react with the flag of your country to get the role of the country you live in!";
                break;
        }

        const messageReply = await interaction.followUp({
            fetchReply: true,
            content: ObjectUtil.validString(custom) ? custom : defaultMessage,
        });

        try {
            await messageReply.channel.messages.fetch({
                message: messageReply.id,
                force: true,
                cache: true,
            });
        } catch {
            return replyOrFollowUp(interaction, "I am not allowed to post/see messages in this channel");
        }

        try {
            const newInteraction = Builder(InteractionFlagModel, {
                guildId: interaction.guildId!,
                messageId: messageReply.id,
                channelId: messageReply.channelId,
                type: type,
            }).build();
            await this.interactionRepo.saveInteraction(newInteraction);
        } catch {
            return replyOrFollowUp(interaction, "unknown error occurred");
        }
    }

    @Slash({
        name: "make_report",
        defaultMemberPermissions: PermissionsBitField.Flags.Administrator,
        description: "generate csv report of all members of roles made by this bot",
    })
    private async makeReport(
        @SlashChoice({ name: "languages", value: InteractionType.LANGUAGE })
        @SlashChoice({ name: "countries", value: InteractionType.FLAG })
        @SlashOption({
            name: "type",
            description: "What type do you wish to generate a report for",
            required: true,
            type: ApplicationCommandOptionType.Number,
        })
        type: InteractionType,
        interaction: CommandInteraction,
    ): Promise<void> {
        await interaction.deferReply({
            ephemeral: true,
        });
        const engine = this.flagManager.getEngineFromType(type);
        if (!engine) {
            return;
        }
        const reportMap = await engine.getReportMap(interaction.guildId!);
        const csvMap: [string, number, string[]][] = [];
        for (const [role, members] of reportMap) {
            const memberArr = members.map(member => member.user.tag);
            csvMap.push([role.name, memberArr.length, memberArr]);
        }
        const csvStr = csvMap.map(s => s.join(",")).join("\r\n");
        if (!ObjectUtil.validString(csvStr)) {
            return replyOrFollowUp(interaction, "No data to generate");
        }
        const buf = Buffer.from(csvStr, "utf8");
        await interaction.editReply({
            content: "Report generated",
            files: [
                {
                    attachment: buf,
                    name: "report.csv",
                },
            ],
        });
    }
}
