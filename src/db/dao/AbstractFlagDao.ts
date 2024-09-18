import { AbstractTypeOrmDao } from "./AbstractTypeOrmDao.js";
import { DataSource, EntityManager, type EntityTarget, FindOptionsWhere } from "typeorm";
import { AbstractFlagModel } from "../../model/DB/guild/AbstractFlagModel.js";

export abstract class AbstractFlagDao<T extends AbstractFlagModel> extends AbstractTypeOrmDao<T> {
    protected constructor(ds: DataSource, model: EntityTarget<T>) {
        super(ds, model);
    }

    public getAllEntries(guildId: string, transaction?: EntityManager): Promise<T[]> {
        return this.getRepository(transaction).findBy({
            guildId,
        } as FindOptionsWhere<T>);
    }

    public createEntry(model: T, transaction?: EntityManager): Promise<T> {
        return this.getRepository(transaction).save(model);
    }

    public async removeEntry(guildId: string, roleId: string, transaction?: EntityManager): Promise<boolean> {
        const result = await this.getRepository(transaction).delete({ guildId, roleId } as FindOptionsWhere<T>);
        return result.affected === 1;
    }
}
