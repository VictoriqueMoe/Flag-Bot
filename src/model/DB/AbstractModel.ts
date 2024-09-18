import { IGuildAware } from "./IGuildAware.js";
import { Column, CreateDateColumn, PrimaryGeneratedColumn, RelationOptions, UpdateDateColumn } from "typeorm";

export abstract class AbstractModel implements IGuildAware {
    public static readonly joinCol = "guildId";

    public static readonly cascadeOps: RelationOptions = {
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    };

    @PrimaryGeneratedColumn("increment")
    public id: number;

    @Column()
    public guildId: string;

    @CreateDateColumn()
    public createdAt: Date;

    @UpdateDateColumn()
    public updatedAt: Date;
}
