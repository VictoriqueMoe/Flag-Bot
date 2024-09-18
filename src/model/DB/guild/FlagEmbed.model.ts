import { Column } from "typeorm";

export class FlagEmbed {
    @Column({ nullable: false })
    public alpha2Code: string;

    @Column({ nullable: false })
    public roleId: string;
}
