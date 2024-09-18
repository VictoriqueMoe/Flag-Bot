import { singleton } from "tsyringe";
import { AbstractFlagRepo } from "./AbstractFlagRepo.js";
import { FlagModel } from "../../model/DB/guild/Flag.model.js";
import { FlagDao } from "../dao/FlagDao.js";

@singleton()
export class FlagRepo extends AbstractFlagRepo<FlagModel, FlagDao> {
    public constructor(flagDao: FlagDao) {
        super(flagDao);
    }
}
