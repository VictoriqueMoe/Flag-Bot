import { Client } from "discordx";
import { AsyncTask, LongIntervalJob, ToadScheduler } from "toad-scheduler";
import { container } from "tsyringe";
import constructor from "tsyringe/dist/typings/types/constructor";
import METHOD_EXECUTOR_TIME_UNIT from "../model/enums/METHOD_EXECUTOR_TIME_UNIT.js";

export const scheduler = new ToadScheduler();

/**
 * Run a method on this bean every x as defined by the time unit. <br />
 * <strong>Note: the class containing this method must be registered with tsyringe for this decorator to work</strong>
 * @param time
 * @param timeUnit
 * @param runImmediately
 * @constructor
 */
export function RunEvery<T>(
    time: number,
    timeUnit: METHOD_EXECUTOR_TIME_UNIT | string,
    runImmediately = false,
): (target: T, propertyKey: string, descriptor: PropertyDescriptor) => void {
    const client = container.isRegistered(Client) ? container.resolve(Client) : null;
    return function (target: T, propertyKey: string, descriptor: PropertyDescriptor): void {
        const targetCast = target as constructor<T>;
        container.afterResolution(
            targetCast.constructor as constructor<T>,
            (_t, result) => {
                const task = new AsyncTask(
                    `${targetCast.constructor.name}.${propertyKey}`,
                    () => {
                        return descriptor.value.call(result, client);
                    },
                    err => {
                        console.error(err);
                    },
                );

                const job = new LongIntervalJob(
                    {
                        [timeUnit]: time,
                    },
                    task,
                );
                console.info(
                    `Register method: "${targetCast.constructor.name}.${propertyKey}()" to run every ${time} ${timeUnit}`,
                );
                scheduler.addLongIntervalJob(job);
                if (runImmediately) {
                    descriptor.value.call(result, client);
                }
            },
            {
                frequency: "Once",
            },
        );
    };
}
