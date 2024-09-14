import { AbstractFactory } from "../AbstractFactory.js";
import { IFlagEngine } from "../../engine/IFlagEngine.js";
import { injectAll, registry, singleton } from "tsyringe";
import { Tokens } from "../../DI/Tokens.js";
import { getInstanceCashingSingletonFactory } from "../../DI/moduleRegistrar.js";
import { CountryFlagEngine } from "../../engine/impl/CountryFlagEngine.js";
import { LanguageFlagEngine } from "../../engine/impl/LanguageFlagEngine.js";

@singleton()
@registry([
    { token: Tokens.IFlagEngine, useFactory: getInstanceCashingSingletonFactory(CountryFlagEngine) },
    { token: Tokens.IFlagEngine, useFactory: getInstanceCashingSingletonFactory(LanguageFlagEngine) },
])
export class FlagFactory extends AbstractFactory<IFlagEngine> {
    public constructor(@injectAll(Tokens.IFlagEngine) instances: IFlagEngine[]) {
        super(instances);
    }
}
