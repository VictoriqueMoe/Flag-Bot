import { AbstractFactory } from "../AbstractFactory.js";
import { IFlagEngine } from "../../engine/IFlagEngine.js";
import { injectAll, registry, singleton } from "tsyringe";
import { Tokens } from "../../DI/Tokens.js";
import { getInstanceCashingSingletonFactory } from "../../DI/moduleRegistrar.js";
import { CountryFlagEngine } from "../../engine/impl/CountryFlagEngine.js";
import { LanguageFlagEngine } from "../../engine/impl/LanguageFlagEngine.js";
import { NationalityFlagEngine } from "../../engine/impl/NationalityFlagEngine.js";

@singleton()
@registry([
    { token: Tokens.IFlagEngine, useFactory: getInstanceCashingSingletonFactory(CountryFlagEngine) },
    { token: Tokens.IFlagEngine, useFactory: getInstanceCashingSingletonFactory(LanguageFlagEngine) },
    { token: Tokens.IFlagEngine, useFactory: getInstanceCashingSingletonFactory(NationalityFlagEngine) },
])
export class FlagFactory extends AbstractFactory<IFlagEngine> {
    public constructor(@injectAll(Tokens.IFlagEngine) instances: IFlagEngine[]) {
        super(instances);
    }
}
