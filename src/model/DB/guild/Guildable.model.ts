import {IGuildAware} from "../IGuildAware";
import {Column, Entity, OneToMany} from "typeorm";
import {FlagModel} from "./Flag.model";

@Entity()
export class GuildableModel implements IGuildAware {

    @Column({
        primary: true
    })
    public guildId: string;

    @OneToMany(() => FlagModel, flagModel => flagModel.guildableModel)
    public flagModel: FlagModel[];

}