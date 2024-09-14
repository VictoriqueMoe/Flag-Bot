/**
 * Any factory annotated with @registry must implement this interface to resolve any engines
 */
export interface IDiFactory<T> {
    /**
     * Get an immutable set of all engines this abstract factory can produce
     */
    get engines(): Set<T>;
}
