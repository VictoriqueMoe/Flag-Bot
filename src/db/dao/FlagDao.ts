import { AbstractFlagDao } from "./AbstractFlagDao.js";
import { FlagModel } from "../../model/DB/guild/Flag.model.js";
import { DataSource } from "typeorm";
import { singleton } from "tsyringe";

@singleton()
export class FlagDao extends AbstractFlagDao<FlagModel> {
    public constructor(ds: DataSource) {
        super(ds, FlagModel);
    }
}
