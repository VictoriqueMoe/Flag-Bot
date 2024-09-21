import { singleton } from "tsyringe";
import { LanguageModel } from "../../model/DB/guild/Language.model.js";
import { LanguageDao } from "../dao/LanguageDao.js";
import { AbstractFlagRepo } from "./AbstractFlagRepo.js";

@singleton()
export class LanguageRepo extends AbstractFlagRepo<LanguageModel, LanguageDao> {
    public constructor(private languageDao: LanguageDao) {
        super(languageDao);
    }

    public getLanguageByGuildId(languageCode: string, guildId: string): Promise<LanguageModel | null> {
        return this.languageDao.getLanguageByGuildId(languageCode, guildId);
    }
}
