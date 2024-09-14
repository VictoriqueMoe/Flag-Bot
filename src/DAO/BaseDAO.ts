import { DataSource } from "typeorm";
import { container } from "tsyringe";

export abstract class BaseDAO {
    protected constructor() {
        BaseDAO._ds = container.resolve(DataSource);
    }

    private static _ds: DataSource;

    public get ds(): DataSource {
        return BaseDAO._ds;
    }
}
