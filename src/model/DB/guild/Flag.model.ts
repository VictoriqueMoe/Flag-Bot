import {AbstractModel} from "../AbstractModel.js";
import {Column, Entity, JoinColumn, ManyToOne, Unique} from "typeorm";
import type {GuildableModel} from "./Guildable.model.js";

@Entity()
@Unique("uniqueIndex", ["alpha2Code", "roleId", "guildId"])
export class FlagModel extends AbstractModel {

    @Column({nullable: false})
    public alpha2Code: string;

    @Column({nullable: false})
    public roleId: string;

    @ManyToOne("GuildableModel", "flagModel", AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    public guildableModel: GuildableModel;
}
