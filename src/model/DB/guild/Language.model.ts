import { Column, Entity, JoinColumn, ManyToOne, Unique } from "typeorm";
import { AbstractModel } from "../AbstractModel.js";
import type { GuildableModel } from "./Guildable.model.js";
import { AbstractFlagModel } from "./AbstractFlagModel.js";

@Entity()
@Unique("uniqueIndex", ["roleId", "guildId", "languageCode"])
export class LanguageModel extends AbstractFlagModel {
    @Column({ nullable: false })
    public languageCode: string;

    @ManyToOne("GuildableModel", "languageModel", AbstractModel.cascadeOps)
    @JoinColumn({ name: AbstractModel.joinCol })
    public guildableModel: GuildableModel;
}
