import {injectable} from "tsyringe";
import {ArgsOf, Client, Discord, On} from "discordx";
import {BaseDAO, UniqueViolationError} from "../DAO/BaseDAO";
import {getManager, Repository, Transaction, TransactionRepository} from "typeorm";
import {GuildableModel} from "../model/DB/guild/Guildable.model";
import {InteractionUtils} from "../utils/Utils";

@Discord()
@injectable()
export class OnReady extends BaseDAO<any> {

    public constructor(private _client: Client) {
        super();
    }

    @On("ready")
    private async initialize([client]: ArgsOf<"ready">): Promise<void> {
        await client.user.setActivity('FLAGS!!', {type: 'PLAYING'});
        await this.populateGuilds();
        await this.cleanUpGuilds();
        await this.initAppCommands();
        console.log("Bot logged in");
    }

    @On("rateLimit")
    private async rateLimit([rateLimitData]: ArgsOf<"rateLimit">, client: Client): Promise<void> {
        console.warn(rateLimitData);
    }

    @On("interactionCreate")
    private async intersectionInit([interaction]: ArgsOf<"interactionCreate">): Promise<void> {
        try {
            await this._client.executeInteraction(interaction);
        } catch (e) {
            console.error(e);
            if (interaction.isApplicationCommand() || interaction.isMessageComponent()) {
                return InteractionUtils.replyOrFollowUp(interaction, "Something went wrong, please notify my developer: <@697417252320051291>");
            }
        }
    }


    private async populateGuilds(): Promise<void> {
        const guilds = this._client.guilds.cache;
        return getManager().transaction(async transactionManager => {
            for (const [guildId] of guilds) {
                const guild = BaseDAO.build(GuildableModel, {
                    guildId
                });
                try {
                    await super.commitToDatabase(transactionManager, [guild], GuildableModel, {
                        silentOnDupe: true
                    });
                } catch (e) {
                    if (!(e instanceof UniqueViolationError)) {
                        throw e;
                    }
                }
            }
        });
    }

    private async initAppCommands(): Promise<void> {
        await this._client.initApplicationCommands();
        await this._client.initApplicationPermissions();
    }

    @Transaction()
    private async cleanUpGuilds(@TransactionRepository(GuildableModel) repo?: Repository<GuildableModel>): Promise<void> {
        const guildsJoined = [...this._client.guilds.cache.keys()];
        for (const guildsJoinedId of guildsJoined) {
            const guildModels = await repo.find({
                where: {
                    "guildId": guildsJoinedId
                }
            });
            if (!guildModels) {
                await repo.delete({
                    guildId: guildsJoinedId
                });
            }
        }
    }
}