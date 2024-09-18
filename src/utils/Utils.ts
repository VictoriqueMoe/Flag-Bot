import { CommandInteraction, InteractionReplyOptions, MessageComponentInteraction } from "discord.js";

export class ObjectUtil {
    public static guid(): string {
        function s4(): string {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
    }

    public static isValidObject(obj: unknown): obj is Record<string, unknown> {
        return typeof obj === "object" && obj !== null && obj !== undefined && Object.keys(obj).length > 0;
    }

    public static validString(...strings: Array<unknown>): boolean {
        if (strings.length === 0) {
            return false;
        }
        for (const currString of strings) {
            if (typeof currString !== "string") {
                return false;
            }
            if (currString.length === 0) {
                return false;
            }
            if (currString.trim().length === 0) {
                return false;
            }
        }
        return true;
    }

    public static removeObjectFromArray<T>(itemToRemove: T, arr: T[]): void {
        let arrLen = arr.length;
        while (arrLen--) {
            const currentItem: T = arr[arrLen];
            if (itemToRemove === currentItem) {
                arr.splice(arrLen, 1);
            }
        }
    }
}

export function isValidArray(array: any): array is any[] {
    return Array.isArray(array) && array.length > 0;
}

export async function replyOrFollowUp(
    interaction: CommandInteraction | MessageComponentInteraction,
    replyOptions:
        | (InteractionReplyOptions & {
              ephemeral?: boolean;
          })
        | string,
): Promise<void> {
    // if interaction is already replied
    if (interaction.replied) {
        await interaction.followUp(replyOptions);
        return;
    }

    // if interaction is deferred but not replied
    if (interaction.deferred) {
        await interaction.editReply(replyOptions);
        return;
    }

    // if interaction is not handled yet
    await interaction.reply(replyOptions);
}
