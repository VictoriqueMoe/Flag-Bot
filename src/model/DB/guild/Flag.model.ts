import {AbstractModel} from "../AbstractModel.js";
import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import type {GuildableModel} from "./Guildable.model.js";

@Entity()
export class FlagModel extends AbstractModel {

    @Column({unique: true, nullable: false})
    public alpha2Code: string;

    @Column({unique: true, nullable: false})
    public roleId: string;

    @ManyToOne("GuildableModel", "flagModel", AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    public guildableModel: GuildableModel;
}
