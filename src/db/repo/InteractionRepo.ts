import { singleton } from "tsyringe";
import { InteractionDao } from "../dao/InteractionDao.js";
import { InteractionFlagModel } from "../../model/DB/guild/InteractionFlag.model.js";
import { InteractionType } from "../../model/enums/InteractionType.js";

@singleton()
export class InteractionRepo {
    public constructor(private dao: InteractionDao) {}

    public getAllInteractions(guildId?: string): Promise<InteractionFlagModel[]> {
        return this.dao.getAllInteractions(guildId);
    }

    public getInteraction(guildId: string, messageId: string): Promise<InteractionFlagModel | null> {
        return this.dao.getInteraction(guildId, messageId);
    }

    public interactionExists(guildId: string, type: InteractionType): Promise<boolean> {
        return this.dao.interactionExists(guildId, type);
    }

    public saveInteraction(interaction: InteractionFlagModel): Promise<InteractionFlagModel> {
        return this.dao.saveInteraction(interaction);
    }

    public deleteInteraction(guildId: string, messageId: string): Promise<boolean> {
        return this.dao.deleteInteraction(guildId, messageId);
    }

    public deleteAllInteractions(guildId: string): Promise<boolean> {
        return this.dao.deleteAllInteractions(guildId);
    }

    public truncate(): Promise<void> {
        return this.dao.truncate();
    }

    public async clearQueryResultCache(): Promise<void> {
        await this.dao.dataSource.queryResultCache?.clear();
    }
}
