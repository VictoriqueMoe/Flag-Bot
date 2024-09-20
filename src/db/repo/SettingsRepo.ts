import { SettingsDao } from "../dao/SettingsDao.js";
import { Builder } from "builder-pattern";
import { singleton } from "tsyringe";
import { SettingsModel } from "../../model/DB/guild/Settings.model.js";
import { SettingsMap } from "../../model/typeings.js";
import SETTING from "../../model/enums/Settings.js";

@singleton()
export class SettingsRepo {
    public constructor(private settingsDao: SettingsDao) {}

    public async saveOrUpdateSettings(guildId: string, settingMap: SettingsMap): Promise<SettingsModel[]> {
        const settingsToUpdatePromises: Promise<SettingsModel>[] = [];
        for (const [setting, value] of settingMap) {
            settingsToUpdatePromises.push(this.getSettingToUpdate(guildId, setting, value));
        }
        const settingsToUpdate = await Promise.all(settingsToUpdatePromises);
        return this.settingsDao.saveOrUpdateSettings(settingsToUpdate);
    }

    public async saveOrUpdateSetting(guildId: string, setting: SETTING, value: string): Promise<SettingsModel> {
        const settingToSave = await this.getSettingToUpdate(guildId, setting, value);
        return this.settingsDao.saveOrUpdateSetting(settingToSave);
    }

    public async deleteSetting(guildId: string, setting: SETTING): Promise<boolean> {
        const settingToDelete = await this.settingsDao.getSetting(guildId, setting);
        if (!settingToDelete) {
            throw new Error("Unable to find setting");
        }
        return this.settingsDao.deleteSetting(settingToDelete);
    }

    public hasSetting(guildId: string, setting: SETTING): Promise<boolean> {
        return this.settingsDao.hasSetting(guildId, setting);
    }

    public getSettings(guildId: string, settings: SETTING[]): Promise<SettingsModel[]> {
        return this.settingsDao.getSettings(guildId, settings);
    }

    public getSetting(guildId: string, setting: SETTING): Promise<SettingsModel | null> {
        return this.settingsDao.getSetting(guildId, setting);
    }

    private async getSettingToUpdate(guildId: string, setting: SETTING, value: string): Promise<SettingsModel> {
        let settingToSave = await this.settingsDao.getSetting(guildId, setting);
        if (!settingToSave) {
            settingToSave = Builder(SettingsModel).setting(setting).value(value).guildId(guildId).build();
        } else {
            settingToSave.value = value;
        }
        return settingToSave;
    }
}
