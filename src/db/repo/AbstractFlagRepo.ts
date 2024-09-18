import { AbstractFlagDao } from "../dao/AbstractFlagDao.js";
import { AbstractFlagModel } from "../../model/DB/guild/AbstractFlagModel.js";

export abstract class AbstractFlagRepo<F extends AbstractFlagModel, T extends AbstractFlagDao<F>> {
    protected constructor(private dao: T) {}

    public createLanguageEntry(model: F): Promise<F> {
        return this.dao.createEntry(model);
    }

    public removeEntry(guildId: string, roleId: string): Promise<boolean> {
        return this.dao.removeEntry(guildId, roleId);
    }

    public getAllEntries(guildId: string): Promise<F[]> {
        return this.dao.getAllEntries(guildId);
    }
}
