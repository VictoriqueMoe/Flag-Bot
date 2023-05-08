import {GuildMember, MessageReaction, PartialMessageReaction, Role} from "discord.js";
import {InteractionType} from "../model/enums/InteractionType.js";

export interface IFlagEngine {

    /**
     * Get the type of interaction this engine supports
     * @returns {InteractionType}
     */
    get type(): InteractionType;

    /**
     * Handle when a user reacts with a flag
     * @param {GuildMember} guildMember
     * @param {string} flagEmoji
     * @param reaction
     * @returns {Promise<void>}
     */
    handleReactionAdd(guildMember: GuildMember, flagEmoji: string, reaction?: MessageReaction | PartialMessageReaction): Promise<void>;

    /**
     * Handle when a user removes a flag reaction
     * @param {string} flagEmoji
     * @param {GuildMember} guildMember
     * @param reaction
     * @returns {Promise<void>}
     */
    handleReactionRemove(flagEmoji: string, guildMember: GuildMember, reaction?: MessageReaction | PartialMessageReaction): Promise<void>;

    /**
     * Get a report of all users who  have reacted with flags
     * @param {string} guildId
     * @returns {Promise<Map<Role, GuildMember[]>>}
     */
    getReportMap(guildId: string): Promise<Map<Role, GuildMember[]>>;
}
