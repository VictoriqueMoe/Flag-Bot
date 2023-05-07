import {Column, Entity, JoinColumn, ManyToOne, Unique} from "typeorm";
import {AbstractModel} from "../AbstractModel.js";
import {GuildableModel} from "./Guildable.model.js";

@Entity()
@Unique("uniqueIndex", ["roleId", "guildId", "languageCode", "languageName"])
export class LanguageModel extends AbstractModel {

    @Column({nullable: false})
    public languageCode: string;

    @Column({nullable: false})
    public languageName: string;

    @Column({nullable: false})
    public roleId: string;

    @ManyToOne("GuildableModel", "languageModel", AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    public guildableModel: GuildableModel;
}
