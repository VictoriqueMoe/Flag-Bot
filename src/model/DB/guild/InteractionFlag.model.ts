import {AbstractModel} from "../AbstractModel.js";
import {Column, Entity, JoinColumn, ManyToOne, Unique} from "typeorm";
import {GuildableModel} from "./Guildable.model.js";

@Entity()
@Unique("uniqueConstraint", ["guildId"])
export class InteractionFlagModel extends AbstractModel {

    @Column({nullable: false})
    public messageId: string;

    @ManyToOne(() => GuildableModel, guildableModel => guildableModel.flagModel, AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    guildableModel: GuildableModel;
}
