import { type ArgsOf, Discord, On } from "discordx";
import { injectable } from "tsyringe";
import { BotRoleManager } from "../manager/BotRoleManager.js";
import { FlagManager } from "../manager/FlagManager.js";
import { InteractionRepo } from "../db/repo/InteractionRepo.js";
import { InteractionFlagModel } from "../model/DB/guild/InteractionFlag.model.js";
import { Role } from "discord.js";
import { RestCountriesManager } from "../manager/RestCountriesManager.js";

@Discord()
@injectable()
export class RoleEvents {
    public constructor(
        private botRoleManager: BotRoleManager,
        private flagManager: FlagManager,
        private interactionRepo: InteractionRepo,
        private restCountriesManager: RestCountriesManager,
    ) {}

    @On()
    private async roleDelete([role]: ArgsOf<"roleDelete">): Promise<void> {
        try {
            await this.removeReacts(role);
        } catch (e) {
            console.error(e);
        }
    }

    private async removeReacts(role: Role): Promise<void> {
        const guild = role.guild;
        const guildId = guild.id;
        const interactionFlagModels: InteractionFlagModel[] = await this.interactionRepo.getAllInteractions(guildId);
        for (const interaction of interactionFlagModels) {
            const messageId = interaction.messageId;
            const type = interaction.type;
            const engine = this.flagManager.getEngineFromType(type);
            if (!engine) {
                continue;
            }
            const cca2 = await engine.getCca2FromRole(guildId, role.id);
            if (!cca2) {
                continue;
            }

            const channel = await guild.channels.fetch(interaction.channelId);
            if (!channel?.isTextBased()) {
                continue;
            }
            const message = await channel.messages.fetch({
                message: messageId,
                cache: true,
            });
            const messageReactions = message.reactions.cache;
            for (const [, reaction] of messageReactions) {
                if (!reaction.emoji?.name) {
                    continue;
                }
                const emojiInfo = await this.restCountriesManager.getCountyLanguages(reaction.emoji.name);
                if (emojiInfo?.cca2 === cca2) {
                    await reaction.remove();
                }
            }
        }
    }
}
