import { singleton } from "tsyringe";
import { DataSource } from "typeorm";
import { NationalityModel } from "../../model/DB/guild/Nationality.model.js";
import { AbstractFlagDao } from "./AbstractFlagDao.js";

@singleton()
export class NationalityDao extends AbstractFlagDao<NationalityModel> {
    public constructor(ds: DataSource) {
        super(ds, NationalityModel);
    }
}
