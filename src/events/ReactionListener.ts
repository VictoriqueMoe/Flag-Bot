import { type ArgsOf, Discord, On } from "discordx";
import { injectable } from "tsyringe";
import { GuildMember, Message, MessageReaction, PartialMessage, PartialMessageReaction } from "discord.js";
import { InteractionType } from "../model/enums/InteractionType.js";
import { FlagManager } from "../manager/FlagManager.js";
import { NoRolesFoundException } from "../exceptions/NoRolesFoundException.js";
import { DupeRoleException } from "../exceptions/DupeRoleException.js";
import { InteractionRepo } from "../db/repo/InteractionRepo.js";

@Discord()
@injectable()
export class ReactionListener {
    public constructor(
        private flagManager: FlagManager,
        private interactionRepo: InteractionRepo,
    ) {}

    @On()
    private async messageReactionRemove([reaction, user]: ArgsOf<"messageReactionRemove">): Promise<void> {
        if (user.bot) {
            return;
        }
        const messageOgPoser = reaction.message.member;
        if (!messageOgPoser) {
            return;
        }
        const guildMember = await reaction?.message?.guild?.members.fetch({
            force: true,
            user: user.id,
        });
        if (!guildMember || messageOgPoser.id !== guildMember?.guild?.members?.me?.id) {
            return;
        }
        const emoji = reaction.emoji;
        const flagEmoji = emoji.name;
        const type = await this.getTypeFromReaction(reaction);
        if (type === null || !flagEmoji) {
            return;
        }
        const engine = this.flagManager.getEngineFromType(type);
        if (!engine) {
            return;
        }
        await engine.handleReactionRemove(flagEmoji, guildMember, reaction);
    }

    private async getTypeFromReaction(
        reaction: MessageReaction | PartialMessageReaction,
    ): Promise<InteractionType | null> {
        const { message } = reaction;
        const modelFromDb = await this.interactionRepo.getInteraction(message.guildId!, message.id);
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
        const { message } = reaction;
        const messageOgPoser = message.member;
        const emoji = reaction.emoji;
        const flagEmoji = emoji.name;
        if (!flagEmoji) {
            return;
        }
        const guildMember = await message?.guild?.members.fetch({
            force: true,
            user: user.id,
        });
        if (!messageOgPoser || messageOgPoser.id !== guildMember?.guild?.members?.me?.id) {
            return;
        }
        const type = await this.getTypeFromReaction(reaction);
        if (type === null) {
            await this.removeReaction(flagEmoji, guildMember, message);
            return;
        }
        const engine = this.flagManager.getEngineFromType(type);
        if (!engine || !flagEmoji) {
            return;
        }
        try {
            await engine.handleReactionAdd(guildMember, flagEmoji, reaction);
        } catch (e) {
            if (e instanceof NoRolesFoundException || e instanceof DupeRoleException) {
                try {
                    await this.removeReaction(flagEmoji, guildMember, message);
                } catch {
                    /* empty */
                }
            } else {
                throw e;
            }
        }
    }

    private removeReaction(
        flagEmoji: string,
        guildMember: GuildMember,
        message: Message | PartialMessage,
    ): Promise<MessageReaction> | null {
        return message?.reactions?.cache.find(r => r.emoji.name == flagEmoji)?.users.remove(guildMember) ?? null;
    }
}
