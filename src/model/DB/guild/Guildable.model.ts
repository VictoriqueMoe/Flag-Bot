import type {FlagModel} from "./Flag.model.js";
import {Column, Entity, OneToMany} from "typeorm";
import {IGuildAware} from "../IGuildAware.js";
import type {InteractionFlagModel} from "./InteractionFlag.model.js";

@Entity()
export class GuildableModel implements IGuildAware {

    @Column({
        primary: true
    })
    public guildId: string;

    @OneToMany("FlagModel", "guildableModel")
    public flagModel: FlagModel[];

    @OneToMany("InteractionFlagModel", "guildableModel")
    public interactionFlagModel: InteractionFlagModel[];
}
