import { singleton } from "tsyringe";
import { AbstractTypeOrmDao } from "./AbstractTypeOrmDao.js";
import { GuildableModel } from "../../model/DB/guild/Guildable.model.js";
import { DataSource, EntityManager } from "typeorm";

@singleton()
export class GuildDao extends AbstractTypeOrmDao<GuildableModel> {
    public constructor(ds: DataSource) {
        super(ds, GuildableModel);
    }

    public getAllGuilds(transaction?: EntityManager): Promise<GuildableModel[]> {
        return this.getRepository(transaction).find();
    }

    public saveGuild(model: GuildableModel, transaction?: EntityManager): Promise<GuildableModel> {
        return this.getRepository(transaction).save(model);
    }

    public async removeGuild(guildId: string, transaction?: EntityManager): Promise<boolean> {
        const result = await this.getRepository(transaction).delete({
            guildId,
        });
        return result.affected === 1;
    }

    public getGuild(guildId: string, transaction?: EntityManager): Promise<GuildableModel | null> {
        return this.getRepository(transaction).findOneBy({ guildId });
    }

    public async hasGuild(guildId: string, transaction?: EntityManager): Promise<boolean> {
        const res = await this.getRepository(transaction).countBy({ guildId });
        return res === 1;
    }
}
