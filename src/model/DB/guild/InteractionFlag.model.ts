import {AbstractModel} from "../AbstractModel.js";
import {Column, Entity, JoinColumn, ManyToOne, Unique} from "typeorm";
import type {GuildableModel} from "./Guildable.model.js";
import {InteractionType} from "../../enums/InteractionType.js";

@Entity()
@Unique("uniqueConstraint", ["guildId", "type"])
export class InteractionFlagModel extends AbstractModel {

    @Column({nullable: false})
    public messageId: string;

    @Column({nullable: false})
    public channelId: string;

    @Column({
        type: "integer",
        nullable: false,
        default: InteractionType.FLAG
    })
    public type: InteractionType;

    @ManyToOne("GuildableModel", "flagModel", AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    public guildableModel: GuildableModel;
}
