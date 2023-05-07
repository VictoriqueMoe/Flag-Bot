import {Column, Entity, JoinColumn, ManyToOne, Unique} from "typeorm";
import {AbstractModel} from "../AbstractModel.js";
import {GuildableModel} from "./Guildable.model.js";

@Entity()
@Unique("uniqueIndex", ["alpha2Code", "roleId", "guildId"])
export class LanguageModel extends AbstractModel {

    @Column({nullable: false})
    public alpha2Code: string;

    @Column({nullable: false})
    public language: string;

    @Column({nullable: false})
    public roleId: string;

    @ManyToOne("GuildableModel", "languageModel", AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    public guildableModel: GuildableModel;
}
