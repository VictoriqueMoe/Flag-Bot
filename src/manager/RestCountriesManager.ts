import { singleton } from "tsyringe";
import { Country, CountryInfo, CountryLanguage } from "../model/typeings.js";
import { RunEvery } from "../decorators/RunEvery.js";
import METHOD_EXECUTOR_TIME_UNIT from "../model/enums/METHOD_EXECUTOR_TIME_UNIT.js";
import { getAverageColor } from "fast-average-color-node";
import { HexColorString } from "discord.js";
import { BotRoleManager } from "./BotRoleManager.js";
import { GuildManager } from "./GuildManager.js";
import { InteractionType } from "../model/enums/InteractionType.js";

@singleton()
export class RestCountriesManager {
    private static readonly baseUrl = `https://restcountries.com/v3.1`;
    private englishNotPrimary = [
        "BI",
        "CM",
        "SZ",
        "IN",
        "KI",
        "LS",
        "MT",
        "MH",
        "NA",
        "NR",
        "PK",
        "PW",
        "PH",
        "RW",
        "WS",
        "SC",
        "SD",
        "TO",
        "TV",
        "VU",
    ];
    private countryFlagEmojiMap: Map<string, Country> = new Map();
    private colourCache: Map<string, HexColorString> = new Map();

    public constructor(
        private botRoleManager: BotRoleManager,
        private guildManager: GuildManager,
    ) {}

    public async getCountyLanguages(emoji: string): Promise<CountryInfo | null> {
        const countryInfo = this.countryFlagEmojiMap.get(emoji);
        if (!countryInfo) {
            return null;
        }
        const languageInfo: CountryLanguage[] = [];
        for (const code in countryInfo.languages) {
            const name = countryInfo.languages[code];
            languageInfo.push({
                code,
                name,
            });
        }
        const primaryColour = await this.getAverageColour(countryInfo.flags.png);
        const demonym = countryInfo?.demonyms?.["eng"]?.m ?? undefined;
        return {
            flag: countryInfo.flag,
            languageInfo,
            primaryColour,
            cca2: countryInfo.cca2,
            name: countryInfo.name,
            demonym,
        };
    }

    @RunEvery(31, METHOD_EXECUTOR_TIME_UNIT.days, true)
    private async init(): Promise<void> {
        this.countryFlagEmojiMap.clear();
        const response = await fetch(
            `${RestCountriesManager.baseUrl}/all?fields=languages,cca2,flags,name,flag,demonyms`,
        );
        if (!response.ok) {
            console.error(await response.text());
            throw new Error("unable to load language codes");
        }
        const allCountryCode: Country[] = await response.json();
        for (const countryResponse of allCountryCode) {
            // Remove english from countries where it is official, but not primary
            if (this.englishNotPrimary.includes(countryResponse.cca2)) {
                if (countryResponse.languages && countryResponse.languages.eng) {
                    delete countryResponse.languages.eng;
                }
            }
            this.countryFlagEmojiMap.set(countryResponse.flag, {
                ...countryResponse,
            });
        }
    }

    @RunEvery(365, METHOD_EXECUTOR_TIME_UNIT.days)
    private clearColourCache(): void {
        this.colourCache.clear();
    }

    private async updateRoleColours(): Promise<void> {
        const guilds = await this.guildManager.getGuilds();
        for (const guild of guilds) {
            const countryRoles = await this.botRoleManager.getAllRolesFromDb(guild.id, InteractionType.FLAG);
            for (const roleInfo of countryRoles) {
                const { role, dbRole } = roleInfo;
                const cca2 = dbRole.alpha2Code;
                const countryInfo = await this.getCountyLanguages(cca2);
                if (countryInfo) {
                    const roleColor = countryInfo.primaryColour;
                    await role.setColor(roleColor);
                }
            }
        }
    }

    private async getAverageColour(url: string): Promise<HexColorString> {
        if (this.colourCache.has(url)) {
            return this.colourCache.get(url)!;
        }
        const colourInfo = await getAverageColor(url, {
            algorithm: "dominant",
            ignoredColor: [255, 255, 255, 255],
        });
        const hex = colourInfo.hex as HexColorString;
        this.colourCache.set(url, hex);
        return hex;
    }
}
