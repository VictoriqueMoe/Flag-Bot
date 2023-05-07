import {DupeRoleException, FlagManager, NoRolesFoundException} from "../model/manager/FlagManager.js";
import {ArgsOf, Discord, On} from "discordx";
import {injectable} from "tsyringe";
import {ArrayUtils, ObjectUtil} from "../utils/Utils.js";
import {InteractionFlagModel} from "../model/DB/guild/InteractionFlag.model.js";
import {GuildMember, Message, MessageReaction, PartialMessage, PartialMessageReaction} from "discord.js";
import {BaseDAO} from "../DAO/BaseDAO.js";
import {BotRoleManager} from "../model/manager/BotRoleManager.js";
import {InteractionType} from "../model/enums/InteractionType.js";

@Discord()
@injectable()
export class ReactionListener extends BaseDAO {

    public constructor(private _flagManager: FlagManager,
                       private _botRoleManager: BotRoleManager) {
        super();
    }

    @On()
    private async messageReactionRemove([reaction, user]: ArgsOf<"messageReactionRemove">): Promise<void> {
        if (user.bot) {
            return;
        }
        const messageOgPoser = reaction.message.member;
        const guildMember = await reaction.message.guild.members.fetch({
            force: true,
            user: user.id
        });
        if (messageOgPoser.id !== guildMember.guild.members.me.id) {
            return;
        }
        const emoji = reaction.emoji;
        const flagEmoji = emoji.name;
        const role = await this._flagManager.createRoleFromFlag(flagEmoji, guildMember.guild.id, false);
        if (!role) {
            return;
        }
        try {
            await guildMember.roles.remove(role);
        } catch {
            return;
        }
        const usersWithRole = await this._botRoleManager.getUsersWithRole(guildMember.guild.id, role.id);
        if (!ArrayUtils.isValidArray(usersWithRole)) {
            await this._botRoleManager.removeRoleBinding(guildMember.guild.id, role.id);
        }
    }

    private async getTypeFromReaction(reaction: MessageReaction | PartialMessageReaction): Promise<InteractionType | null> {
        const {message} = reaction;
        const interactionModel = this.ds.getRepository(InteractionFlagModel);
        const modelFromDb = await interactionModel.findOne({
            where: {
                guildId: message.guildId,
                messageId: message.id
            }
        });
        if (!modelFromDb) {
            return null;
        }
        return modelFromDb.type;
    }

    @On()
    private async messageReactionAdd([reaction, user]: ArgsOf<"messageReactionAdd">): Promise<void> {
        if (user.bot) {
            return;
        }
        const {message} = reaction;
        const messageOgPoser = message.member;
        const emoji = reaction.emoji;
        const flagEmoji = emoji.name;
        if (!ObjectUtil.validString(flagEmoji)) {
            return;
        }
        const guildMember = await message.guild.members.fetch({
            force: true,
            user: user.id
        });
        if (messageOgPoser.id !== guildMember.guild.members.me.id) {
            return;
        }
        const type = await this.getTypeFromReaction(reaction);
        if (type === InteractionType.FLAG) {
            try {
                await this._flagManager.handleReaction(guildMember, flagEmoji);
            } catch (e) {
                if (e instanceof NoRolesFoundException || e instanceof DupeRoleException) {
                    try {
                        await this._removeReaction(flagEmoji, guildMember, message);
                    } catch {

                    }
                } else {
                    throw e;
                }
            }
            return;
        }
    }

    private _removeReaction(flagEmoji: string, guildMember: GuildMember, message: Message | PartialMessage): Promise<MessageReaction> {
        return message.reactions.cache.find(r => r.emoji.name == flagEmoji).users.remove(guildMember);
    }

}
