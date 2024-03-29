import {IGuildAware} from "./IGuildAware.js";
import {Column, CreateDateColumn, RelationOptions, UpdateDateColumn} from "typeorm";

export abstract class AbstractModel implements IGuildAware {

    protected static readonly joinCol = "guildId";

    protected static readonly cascadeOps: RelationOptions = {
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    };

    @Column({
        generated: "increment",
        primary: true
    })
    public id: number;

    @Column()
    public guildId: string;

    @CreateDateColumn()
    public createdAt: Date;

    @UpdateDateColumn()
    public updatedAt: Date;
}
