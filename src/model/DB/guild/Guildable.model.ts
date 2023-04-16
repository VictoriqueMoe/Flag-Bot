import {FlagModel} from "./Flag.model.js";
import {Column, Entity, OneToMany} from "typeorm";
import {IGuildAware} from "../IGuildAware.js";
import {InteractionFlagModel} from "./InteractionFlag.model.js";

@Entity()
export class GuildableModel implements IGuildAware {

    @Column({
        primary: true
    })
    public guildId: string;

    @OneToMany(() => FlagModel, flagModel => flagModel.guildableModel)
    public flagModel: FlagModel[];

    @OneToMany(() => InteractionFlagModel, interactionFlagModel => interactionFlagModel.guildableModel)
    public interactionFlagModel: InteractionFlagModel[];
}
