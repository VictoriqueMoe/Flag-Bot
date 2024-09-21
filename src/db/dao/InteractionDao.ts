import { singleton } from "tsyringe";
import { AbstractTypeOrmDao } from "./AbstractTypeOrmDao.js";
import { InteractionFlagModel } from "../../model/DB/guild/InteractionFlag.model.js";
import { DataSource, EntityManager } from "typeorm";
import { InteractionType } from "../../model/enums/InteractionType.js";

@singleton()
export class InteractionDao extends AbstractTypeOrmDao<InteractionFlagModel> {
    public constructor(ds: DataSource) {
        super(ds, InteractionFlagModel);
    }

    public getAllInteractions(guildId?: string, transaction?: EntityManager): Promise<InteractionFlagModel[]> {
        if (guildId) {
            return this.getRepository(transaction).findBy({ guildId });
        }
        return this.getRepository(transaction).find();
    }

    public async interactionExists(
        guildId: string,
        type: InteractionType,
        transaction?: EntityManager,
    ): Promise<boolean> {
        const result = await this.getRepository(transaction).count({ where: { guildId, type } });
        return result > 0;
    }

    public saveInteraction(
        interaction: InteractionFlagModel,
        transaction?: EntityManager,
    ): Promise<InteractionFlagModel> {
        return this.getRepository(transaction).save(interaction);
    }

    public async deleteInteraction(guildId: string, messageId: string, transaction?: EntityManager): Promise<boolean> {
        const result = await this.getRepository(transaction).delete({ guildId, messageId });
        return result.affected === 1;
    }

    public async deleteAllInteractions(guildId: string, transaction?: EntityManager): Promise<boolean> {
        const result = await this.getRepository(transaction).delete({ guildId });
        return typeof result.affected === "number" && result.affected > 0;
    }

    public truncate(transaction?: EntityManager): Promise<void> {
        return this.getRepository(transaction).clear();
    }

    public getInteraction(
        guildId: string,
        messageId: string,
        transaction?: EntityManager,
    ): Promise<InteractionFlagModel | null> {
        return this.getRepository(transaction).findOneBy({ guildId, messageId });
    }
}
