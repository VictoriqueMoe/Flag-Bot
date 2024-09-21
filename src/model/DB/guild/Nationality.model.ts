import { AbstractFlagModel } from "./AbstractFlagModel.js";
import { Entity, JoinColumn, ManyToOne, Unique } from "typeorm";
import { AbstractModel } from "../AbstractModel.js";
import type { GuildableModel } from "./Guildable.model.js";

@Entity()
@Unique("uniqueIndex", ["alpha2Code", "roleId", "guildId"])
export class NationalityModel extends AbstractFlagModel {
    @ManyToOne("GuildableModel", "nationalityModel", AbstractModel.cascadeOps)
    @JoinColumn({ name: AbstractModel.joinCol })
    public guildableModel: GuildableModel;
}
