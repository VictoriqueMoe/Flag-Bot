import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { AbstractModel } from "../AbstractModel.js";
import type { GuildableModel } from "./Guildable.model.js";
import SETTING from "../../enums/Settings.js";

@Entity()
export class SettingsModel extends AbstractModel {
    @Column({
        nullable: false,
        type: "text",
    })
    public setting: SETTING;

    @Column({
        nullable: false,
    })
    public value: string;

    @ManyToOne("GuildableModel", "settings", AbstractModel.cascadeOps)
    @JoinColumn({ name: AbstractModel.joinCol })
    public guildableModel: GuildableModel;
}
