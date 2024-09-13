import { Client } from "discordx";
import { container, InjectionToken } from "tsyringe";
import constructor from "tsyringe/dist/typings/types/constructor.js";

/**
 * Spring-like post construction executor, this will fire after a dependency is resolved and constructed
 * @param target
 * @param propertyKey
 * @param descriptor
 * @constructor
 */
export function PostConstruct<T>(target: T, propertyKey: string, descriptor: PropertyDescriptor): void {
    container.afterResolution(
        (target as constructor<T>).constructor as InjectionToken<T>,
        (_t, result: T) => {
            let client: Client | null = null;
            if (container.isRegistered(Client)) {
                client = container.resolve(Client);
            }
            descriptor.value.call(result, client);
        },
        {
            frequency: "Once",
        },
    );
}
