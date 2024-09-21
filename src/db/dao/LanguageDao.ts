import { singleton } from "tsyringe";
import { LanguageModel } from "../../model/DB/guild/Language.model.js";
import { DataSource, EntityManager } from "typeorm";
import { AbstractFlagDao } from "./AbstractFlagDao.js";

@singleton()
export class LanguageDao extends AbstractFlagDao<LanguageModel> {
    public constructor(ds: DataSource) {
        super(ds, LanguageModel);
    }

    public getLanguageByGuildId(
        languageCode: string,
        guildId: string,
        transaction?: EntityManager,
    ): Promise<LanguageModel | null> {
        return this.getRepository(transaction).findOneBy({
            languageCode,
            guildId,
        });
    }
}
