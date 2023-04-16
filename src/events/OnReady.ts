import {BaseDAO} from "../DAO/BaseDAO.js";
import {ArgsOf, Client, Discord, On, RestArgsOf} from "discordx";
import {BaseGuildTextChannel, ChannelType} from "discord.js";
import {injectable} from "tsyringe";
import {ArrayUtils, DbUtils, InteractionUtils} from "../utils/Utils.js";
import {GuildableModel} from "../model/DB/guild/Guildable.model.js";
import {ActivityType, InteractionType} from "discord-api-types/v10";
import {InteractionFlagModel} from "../model/DB/guild/InteractionFlag.model.js";

@Discord()
@injectable()
export class OnReady extends BaseDAO {

    public constructor(private _client: Client) {
        super();
    }

    @On()
    private async ready([client]: ArgsOf<"ready">): Promise<void> {
        await client.user.setActivity('FLAGS!!', {type: ActivityType.Playing});
        await this.populateGuilds();
        await this.cleanUpGuilds();
        await this.initAppCommands();
        await this.loadMessages();
        console.log("Bot logged in");
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
            if (interaction.type === InteractionType.ApplicationCommand || interaction.type === InteractionType.MessageComponent) {
                const channel = interaction.channel;
                if (channel && (channel.type !== ChannelType.GuildText || !channel.permissionsFor(me).has("SendMessages"))) {
                    console.error(`cannot send warning message to this channel`, interaction);
                    return;
                }
                try {
                    await InteractionUtils.replyOrFollowUp(
                        interaction,
                        "Something went wrong, please notify my developer: <@697417252320051291>"
                    );
                } catch (e) {
                    console.error(e);
                }
            }
        }
    }


    private populateGuilds(): Promise<void> {
        const guilds = this._client.guilds.cache;
        return this.ds.transaction(async transactionManager => {
            for (const [guildId] of guilds) {
                if (await transactionManager.count(GuildableModel, {
                    where: {
                        guildId
                    }
                }) === 0) {
                    const guild = DbUtils.build(GuildableModel, {
                        guildId
                    });
                    await transactionManager.save(GuildableModel, guild);
                }
            }
        });
    }

    private initAppCommands(): Promise<void> {
        return this._client.initApplicationCommands();
    }

    private async cleanUpGuilds(): Promise<void> {
        const transactionManager = this.ds.manager;
        const guildsJoined = [...this._client.guilds.cache.keys()];
        if (!ArrayUtils.isValidArray(guildsJoined)) {
            await transactionManager.clear(GuildableModel);
            await this.ds.queryResultCache.clear();
            return;
        }
        for (const guildsJoinedId of guildsJoined) {
            const guildModels = await transactionManager.find(GuildableModel, {
                where: {
                    "guildId": guildsJoinedId
                }
            });
            if (!guildModels) {
                await transactionManager.delete(GuildableModel, {
                    guildId: guildsJoinedId,
                });
            }
        }
    }

    private async loadMessages(): Promise<void> {
        const repo = this.ds.getRepository(InteractionFlagModel);
        const allGuilds = this._client.guilds.cache;
        for (const [id, guild] of allGuilds) {
            const messagePost = await repo.findOne({
                where: {
                    guildId: id
                }
            });
            if (!messagePost) {
                continue;
            }
            const {messageId} = messagePost;
            const channels = [...guild.channels.cache.values()];
            for (const channel of channels) {
                const fetchedChannel = await channel.fetch(true);
                if (!(fetchedChannel instanceof BaseGuildTextChannel)) {
                    continue;
                }
                try {
                    const message = await fetchedChannel.messages.fetch({
                        message: messageId,
                        force: true,
                        cache: true
                    });
                    console.log(`Message found: ${message}`);
                    break;
                } catch {

                }
            }
        }
    }
}
