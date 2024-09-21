import type { FlagModel } from "./Flag.model.js";
import { Column, Entity, OneToMany } from "typeorm";
import { IGuildAware } from "../IGuildAware.js";
import type { InteractionFlagModel } from "./InteractionFlag.model.js";
import type { LanguageModel } from "./Language.model";
import type { NationalityModel } from "./Nationality.model.js";
import { SettingsModel } from "./Settings.model.js";

@Entity()
export class GuildableModel implements IGuildAware {
    @Column({
        primary: true,
    })
    public guildId: string;

    @OneToMany("FlagModel", "guildableModel")
    public flagModel: FlagModel[];

    @OneToMany("SettingsModel", "guildableModel")
    public settings: SettingsModel[];

    @OneToMany("NationalityModel", "guildableModel")
    public nationalityModel: NationalityModel[];

    @OneToMany("LanguageModel", "guildableModel")
    public languageModel: LanguageModel[];

    @OneToMany("InteractionFlagModel", "guildableModel")
    public interactionFlagModel: InteractionFlagModel[];
}
