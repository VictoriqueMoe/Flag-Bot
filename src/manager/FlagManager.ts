import {singleton} from "tsyringe";
import {IFlagEngine} from "../engine/IFlagEngine.js";
import {FlagFactory} from "../factory/impl/FlagFactory.js";
import {InteractionType} from "../model/enums/InteractionType.js";

@singleton()
export class FlagManager {
    private readonly _flagEngines: Set<IFlagEngine>;

    public constructor(flagFactory: FlagFactory) {
        this._flagEngines = flagFactory.engines;
    }

    public getEngineFromType(type: InteractionType): IFlagEngine | null {
        for (const flagEngine of this._flagEngines) {
            if (flagEngine.type === type) {
                return flagEngine;
            }
        }
        return null;
    }
}
