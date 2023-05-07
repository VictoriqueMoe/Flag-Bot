import type {FlagModel} from "./Flag.model.js";
import {Column, Entity, OneToMany} from "typeorm";
import {IGuildAware} from "../IGuildAware.js";
import type {InteractionFlagModel} from "./InteractionFlag.model.js";
import {LanguageModel} from "./Language.model";

@Entity()
export class GuildableModel implements IGuildAware {

    @Column({
        primary: true
    })
    public guildId: string;

    @OneToMany("FlagModel", "guildableModel")
    public flagModel: FlagModel[];

    @OneToMany("LanguageModel", "guildableModel")
    public languageModel: LanguageModel[];

    @OneToMany("InteractionFlagModel", "guildableModel")
    public interactionFlagModel: InteractionFlagModel[];
}
