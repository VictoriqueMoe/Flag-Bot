import { SettingsModel } from "../../model/DB/guild/Settings.model.js";
import { DataSource, EntityManager, In } from "typeorm";
import { AbstractTypeOrmDao } from "./AbstractTypeOrmDao.js";
import { singleton } from "tsyringe";
import SETTING from "../../model/enums/Settings.js";

@singleton()
export class SettingsDao extends AbstractTypeOrmDao<SettingsModel> {
    public constructor(ds: DataSource) {
        super(ds, SettingsModel);
    }

    public saveOrUpdateSettings(settings: SettingsModel[], transaction?: EntityManager): Promise<SettingsModel[]> {
        const entityManager = this.getRepository(transaction);
        return entityManager.save(settings);
    }

    public saveOrUpdateSetting(setting: SettingsModel, transaction?: EntityManager): Promise<SettingsModel> {
        const entityManager = this.getRepository(transaction);
        return entityManager.save(setting);
    }

    public async deleteSetting(setting: SettingsModel, transaction?: EntityManager): Promise<boolean> {
        const entityManager = this.getRepository(transaction);
        try {
            await entityManager.delete(setting);
        } catch (e) {
            return false;
        }
        return true;
    }

    public async hasSetting(guildId: string, setting: SETTING, transaction?: EntityManager): Promise<boolean> {
        const entityManager = this.getRepository(transaction);
        const count = await entityManager.countBy({
            guildId,
            setting,
        });
        return count !== 0;
    }

    public getSettings(guildId: string, settings: SETTING[], transaction?: EntityManager): Promise<SettingsModel[]> {
        return this.getRepository(transaction).findBy({
            guildId,
            setting: In(settings),
        });
    }

    public getSetting(guildId: string, setting: SETTING, transaction?: EntityManager): Promise<SettingsModel | null> {
        return this.getRepository(transaction).findOneBy({
            guildId,
            setting,
        });
    }
}
