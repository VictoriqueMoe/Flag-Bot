import {container, instanceCachingFactory} from "tsyringe";
import {ConnectionManager} from "typeorm";

export async function moduleRegistrar(): Promise<void> {
    container.register<ConnectionManager>(ConnectionManager, {
        useFactory: instanceCachingFactory(() => new ConnectionManager())
    });
}

export function registerInstance(...instances: any): void {
    for (const instance of instances) {
        container.registerInstance(instance.constructor, instance);
    }
}