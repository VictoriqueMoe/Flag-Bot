import {GuildMember, Role} from "discord.js";
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
     * @returns {Promise<void>}
     */
    handleReactionAdd(guildMember: GuildMember, flagEmoji: string): Promise<void>;

    /**
     * Handle when a user removes a flag reaction
     * @param {string} flagEmoji
     * @param {GuildMember} guildMember
     * @returns {Promise<void>}
     */
    handleReactionRemove(flagEmoji: string, guildMember: GuildMember): Promise<void>;

    /**
     * Get a report of all users who  have reacted with flags
     * @param {string} guildId
     * @returns {Promise<Map<Role, GuildMember[]>>}
     */
    getReportMap(guildId: string): Promise<Map<Role, GuildMember[]>>;
}
