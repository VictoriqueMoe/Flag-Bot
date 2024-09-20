import { singleton } from "tsyringe";
import { SettingsRepo } from "../db/repo/SettingsRepo.js";
import { SettingsMap } from "../model/typeings.js";
import { SettingsModel } from "../model/DB/guild/Settings.model.js";
import SETTING from "../model/enums/Settings.js";
import { PostConstruct } from "../decorators/PostConstruct.js";
import { GuildManager } from "./GuildManager.js";

@singleton()
export class SettingsManager {
    public constructor(
        private settingRepo: SettingsRepo,
        private guildManager: GuildManager,
    ) {}

    public async getSettings(guildId: string, settings: SETTING[]): Promise<string[]> {
        const settingsModels = await this.settingRepo.getSettings(guildId, settings);
        const returnMapping: string[] = [];
        for (const setting of settings) {
            const model = settingsModels.find(settingsModel => settingsModel.setting === setting);
            if (!model) {
                continue;
            }
            returnMapping.push(model.value);
        }
        return returnMapping;
    }

    public async getSetting(guildId: string, setting: SETTING): Promise<string | null> {
        const settingModel = await this.settingRepo.getSetting(guildId, setting);
        return settingModel?.value ?? null;
    }

    public hasSetting(guildId: string, setting: SETTING): Promise<boolean> {
        return this.settingRepo.hasSetting(guildId, setting);
    }

    public saveOrUpdateSettings(guildId: string, settingMap: SettingsMap): Promise<SettingsModel[]> {
        return this.settingRepo.saveOrUpdateSettings(guildId, settingMap);
    }

    public saveOrUpdateSetting(guildId: string, setting: SETTING, value: string): Promise<SettingsModel> {
        return this.settingRepo.saveOrUpdateSetting(guildId, setting, value);
    }

    public deleteSetting(guildId: string, setting: SETTING): Promise<boolean> {
        return this.settingRepo.deleteSetting(guildId, setting);
    }

    @PostConstruct
    private async initDefaults(): Promise<void> {
        const allGuilds = await this.guildManager.getGuilds();
        for (const guild of allGuilds) {
            const guildId = guild.id;
            const hasRoleAutoColour = await this.hasSetting(guildId, SETTING.AUTO_ROLE_COLOUR);
            const updateSettingMap: SettingsMap = new Map();
            if (!hasRoleAutoColour) {
                updateSettingMap.set(SETTING.AUTO_ROLE_COLOUR, "true");
            }
            if (updateSettingMap.size !== 0) {
                await this.saveOrUpdateSettings(guildId, updateSettingMap);
            }
        }
    }
}
