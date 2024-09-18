import { AbstractModel } from "../AbstractModel.js";
import { Column } from "typeorm";

export abstract class AbstractFlagModel extends AbstractModel {
    @Column({ nullable: false })
    public alpha2Code: string;

    @Column({ nullable: false })
    public roleId: string;
}
