declare module "emoji-unicode" {
    const emojiUnicode: (input: string) => string;

    export default emojiUnicode;
}

declare module "country-flag-emoji" {
    const countryFlagEmoji: Record<
        string,
        {
            code: string;
            unicode: string;
            name: string;
            emoji: string;
        }
    >;
    export default {
        list: Object.values(countryFlagEmoji),
    };
}
