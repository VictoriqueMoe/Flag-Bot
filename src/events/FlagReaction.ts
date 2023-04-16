import {FlagManager} from "../model/manager/FlagManager.js";
import {ArgsOf, Discord, On} from "discordx";
import {injectable} from "tsyringe";
import {ArrayUtils, ObjectUtil} from "../utils/Utils.js";
import {InteractionFlagModel} from "../model/DB/guild/InteractionFlag.model.js";
import {GuildMember, Message, MessageReaction, PartialMessage} from "discord.js";
import {BaseDAO} from "../DAO/BaseDAO.js";

@Discord()
@injectable()
export class FlagReaction extends BaseDAO {

    public constructor(private _flagManager: FlagManager) {
        super();
    }

    @On()
    private async roleDelete([role]: ArgsOf<"roleDelete">): Promise<void> {
        const {id} = role;
        try {
            await this._flagManager.removeRoleBinding(role.guild.id, id, false);
        } catch {

        }
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
        const role = await this._flagManager.getRoleFromAlpha2Code(flagEmoji, guildMember.guild.id, false);
        if (!role) {
            return;
        }
        try {
            await guildMember.roles.remove(role);
        } catch {
            return;
        }
        const usersWithRole = await this._flagManager.getUsersWithRole(guildMember.guild.id, role.id);
        if (!ArrayUtils.isValidArray(usersWithRole)) {
            await this._flagManager.removeRoleBinding(guildMember.guild.id, role.id);
        }
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
        const interactionModel = this.ds.getRepository(InteractionFlagModel);
        const modelFromDb = await interactionModel.findOne({
            where: {
                guildId: message.guildId,
                messageId: message.id
            }
        });
        if (!modelFromDb) {
            return;
        }
        const guildId = guildMember.guild.id;
        if (await this._hasDupes(guildMember)) {
            try {
                await this._removeReaction(flagEmoji, guildMember, message);
            } catch {

            }
            return;
        }
        const role = await this._flagManager.getRoleFromAlpha2Code(flagEmoji, guildId, true);
        if (!role) {
            try {
                await this._removeReaction(flagEmoji, guildMember, message);
            } catch {

            }
            return;
        }
        try {
            await guildMember.roles.add(role);
        } catch {

        }
    }

    private _removeReaction(flagEmoji: string, guildMember: GuildMember, message: Message | PartialMessage): Promise<MessageReaction> {
        return message.reactions.cache.find(r => r.emoji.name == flagEmoji).users.remove(guildMember);
    }

    private async _hasDupes(member: GuildMember): Promise<boolean> {
        const allRoles = await this._flagManager.getAllRolesFromDb(member.guild.id);
        for (const role of allRoles) {
            if (member.roles.cache.has(role.id)) {
                return true;
            }
        }
        return false;
    }
}
