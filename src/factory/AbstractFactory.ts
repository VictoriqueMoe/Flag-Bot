import type {IDiFactory} from "./IDiFactory.js";

export abstract class AbstractFactory<T> implements IDiFactory<T> {

    private readonly _engines: Set<T>;

    protected constructor(engines: T[]) {
        this._engines = new Set(engines);
    }

    public get engines(): Set<T> {
        return this._engines;
    }
}
