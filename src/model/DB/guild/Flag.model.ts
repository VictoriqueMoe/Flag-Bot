import {AbstractModel} from "../AbstractModel";
import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import {GuildableModel} from "./Guildable.model";

@Entity()
export class FlagModel extends AbstractModel {

    @Column({unique: true, nullable: false})
    public alpha2Code: string;

    @Column({unique: true, nullable: false})
    public roleId: string;

    @ManyToOne(() => GuildableModel, guildableModel => guildableModel.flagModel, AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    guildableModel: GuildableModel;
}