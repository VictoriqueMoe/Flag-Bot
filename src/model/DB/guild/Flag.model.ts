import { AbstractModel } from "../AbstractModel.js";
import { Entity, JoinColumn, ManyToOne, Unique } from "typeorm";
import type { GuildableModel } from "./Guildable.model.js";
import { AbstractFlagModel } from "./AbstractFlagModel.js";

@Entity()
@Unique("uniqueIndex", ["alpha2Code", "roleId", "guildId"])
export class FlagModel extends AbstractFlagModel {
    @ManyToOne("GuildableModel", "flagModel", AbstractModel.cascadeOps)
    @JoinColumn({ name: AbstractModel.joinCol })
    public guildableModel: GuildableModel;
}
