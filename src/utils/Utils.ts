import {
    BaseCommandInteraction,
    ContextMenuInteraction,
    GuildMember,
    Message,
    MessageComponentInteraction
} from "discord.js";

export class ObjectUtil {

    public static getUrls(str: string): Set<string> {
        const regexp = /(http(s)?:\/\/.)(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)/gim;
        const matches = str.match(regexp);
        if (!ArrayUtils.isValidArray(matches)) {
            return new Set();
        }
        return new Set(matches);
    }

    public static guid(): string {
        function s4(): string {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    public static isValidObject(obj: unknown): obj is Record<string, any> {
        return typeof obj === "object" && obj !== null && obj !== undefined && Object.keys(obj).length > 0;
    }

    public static isNumeric(n: string): boolean {
        // @ts-ignore
        return !isNaN(parseFloat(n)) && isFinite(n);
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

    public static removeObjectFromArray(itemToRemove: any, arr: any[]): void {
        let arrLen = arr.length;
        while (arrLen--) {
            const currentItem: any = arr[arrLen];
            if (itemToRemove === currentItem) {
                arr.splice(arrLen, 1);
            }
        }
    }
}

export namespace ArrayUtils {
    export function isValidArray(array: any): array is any[] {
        return Array.isArray(array) && array.length > 0;
    }
}

export namespace InteractionUtils {

    export function getUserFromUserContextInteraction(interaction: ContextMenuInteraction): GuildMember | undefined {
        const memberId = interaction.targetId;
        return interaction.guild.members.cache.get(memberId);
    }

    export function getMessageFromContextInteraction(interaction: ContextMenuInteraction): Promise<Message | undefined> {
        const messageId = interaction.targetId;
        return interaction.channel.messages.fetch(messageId);
    }

    export function replyOrFollowUp(interaction: BaseCommandInteraction | MessageComponentInteraction, content: string, ephemeral: boolean = false): Promise<void> {
        if (interaction.replied) {
            return interaction.followUp({
                ephemeral,
                content
            }) as unknown as Promise<void>;
        }
        if (interaction.deferred) {
            return interaction.editReply(content) as unknown as Promise<void>;
        }
        return interaction.reply({
            ephemeral,
            content
        });
    }

    export function getInteractionCaller(interaction: BaseCommandInteraction | MessageComponentInteraction): GuildMember | null {
        const {member} = interaction;
        if (member == null) {
            replyOrFollowUp(interaction, "Unable to extract member");
            throw new Error("Unable to extract member");
        }
        if (member instanceof GuildMember) {
            return member;
        }
        return null;
    }
}