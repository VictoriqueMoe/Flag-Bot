import {AbstractModel} from "../AbstractModel.js";
import {Column, Entity, JoinColumn, ManyToOne, Unique} from "typeorm";
import type {GuildableModel} from "./Guildable.model.js";

@Entity()
@Unique("uniqueConstraint", ["guildId"])
export class InteractionFlagModel extends AbstractModel {

    @Column({nullable: false})
    public messageId: string;

    @ManyToOne("GuildableModel", "flagModel", AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    public guildableModel: GuildableModel;
}
