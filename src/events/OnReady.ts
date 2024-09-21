import { type ArgsOf, Client, Discord, DIService, On, RestArgsOf } from "discordx";
import { ChannelType } from "discord.js";
import { injectable } from "tsyringe";
import { replyOrFollowUp } from "../utils/Utils.js";
import { ActivityType, InteractionType } from "discord-api-types/v10";
import { GuildRepo } from "../db/repo/GuildRepo.js";
import { InteractionRepo } from "../db/repo/InteractionRepo.js";
import { SettingsManager } from "../manager/SettingsManager.js";

@Discord()
@injectable()
export class OnReady {
    public constructor(
        private _client: Client,
        private guildRepo: GuildRepo,
        private interactionRepo: InteractionRepo,
        private settingsManager: SettingsManager,
    ) {}

    public async init(): Promise<void> {
        await this.cleanUpGuilds();
        await this.settingsManager.initDefaults();
    }

    @On()
    private async ready([client]: ArgsOf<"ready">): Promise<void> {
        await client.user.setActivity("FLAGS!!", { type: ActivityType.Playing });
        this.initDi();
        await this.populateGuilds();
        await this.init();
        await this.initAppCommands();
        await this.loadMessages();
        console.log(`Bot logged in as ${client.user.tag}`);
    }

    @On.rest()
    private rateLimited([rateLimitData]: RestArgsOf<"rateLimited">): void {
        console.warn(rateLimitData);
    }

    @On()
    private async interactionCreate([interaction]: ArgsOf<"interactionCreate">, client: Client): Promise<void> {
        try {
            await client.executeInteraction(interaction);
        } catch (e) {
            if (e instanceof Error) {
                console.error(e.message);
            } else {
                console.error(e);
            }
            const me = interaction?.guild?.members?.me ?? interaction.user;
            if (
                interaction.type === InteractionType.ApplicationCommand ||
                interaction.type === InteractionType.MessageComponent
            ) {
                const channel = interaction.channel;
                if (
                    channel &&
                    (channel.type !== ChannelType.GuildText || !channel.permissionsFor(me)?.has("SendMessages"))
                ) {
                    console.error(`cannot send warning message to this channel`, interaction);
                    return;
                }
                try {
                    await replyOrFollowUp(
                        interaction,
                        "Something went wrong, please notify my developer: <@697417252320051291>",
                    );
                } catch (e) {
                    console.error(e);
                }
            }
        }
    }

    private populateGuilds(): Promise<void> {
        const guilds = this._client.guilds.cache;
        return this.guildRepo.populateGuilds(guilds);
    }

    private initDi(): void {
        DIService.engine.getAllServices();
    }

    public initAppCommands(): Promise<void> {
        return this._client.initApplicationCommands();
    }

    private async cleanUpGuilds(): Promise<void> {
        const guildsJoined = [...this._client.guilds.cache.keys()];
        if (guildsJoined.length === 0) {
            await this.interactionRepo.truncate();
            await this.interactionRepo.clearQueryResultCache();
            return;
        }

        const guildsInDb = await this.guildRepo.getAllGuilds();
        const guildsToRemove = guildsInDb.filter(guild => !guildsJoined.includes(guild.guildId));
        for (const guildToRemove of guildsToRemove) {
            await this.guildRepo.removeGuild(guildToRemove.guildId);
        }
    }

    private async loadMessages(): Promise<void> {
        const allGuilds = this._client.guilds.cache;
        for (const [id, guild] of allGuilds) {
            const messagePost = await this.interactionRepo.getAllInteractions(id);
            if (messagePost.length === 0) {
                continue;
            }
            for (const model of messagePost) {
                try {
                    const channel = await guild.channels.fetch(model.channelId);
                    if (!channel?.isTextBased()) {
                        continue;
                    }
                    const message = await channel.messages.fetch({
                        message: model.messageId,
                        force: true,
                        cache: true,
                    });
                    console.log(`Message found: ${message}`);
                } catch {
                    await this.interactionRepo.deleteAllInteractions(id);
                }
            }
        }
    }
}
