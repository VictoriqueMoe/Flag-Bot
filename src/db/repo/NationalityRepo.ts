import { AbstractFlagRepo } from "./AbstractFlagRepo.js";
import { NationalityModel } from "../../model/DB/guild/Nationality.model.js";
import { NationalityDao } from "../dao/NationalityDao.js";
import { singleton } from "tsyringe";

@singleton()
export class NationalityRepo extends AbstractFlagRepo<NationalityModel, NationalityDao> {
    public constructor(nationalityDao: NationalityDao) {
        super(nationalityDao);
    }
}
