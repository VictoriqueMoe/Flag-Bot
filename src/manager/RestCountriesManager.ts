import { singleton } from "tsyringe";
import { Country, CountryLanguage, CountryResponse } from "../model/typeings.js";
import { RunEvery } from "../decorators/RunEvery.js";
import METHOD_EXECUTOR_TIME_UNIT from "../model/enums/METHOD_EXECUTOR_TIME_UNIT.js";

@singleton()
export class RestCountriesManager {
    private static readonly baseUrl = `https://restcountries.com/v3.1`;
    private englishNotPrimary: string[] = [
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
    private countryCodes: Map<string, Country> = new Map();

    public getCountyLanguages(cca2: string): CountryLanguage[] {
        const countryInfo = this.countryCodes.get(cca2);
        if (!countryInfo) {
            return [];
        }
        const retArr: CountryLanguage[] = [];
        for (const code in countryInfo.languages) {
            const name = countryInfo.languages[code];
            retArr.push({
                code,
                name,
            });
        }
        return retArr;
    }

    @RunEvery(31, METHOD_EXECUTOR_TIME_UNIT.days, true)
    private async init(): Promise<void> {
        this.countryCodes.clear();
        const response = await fetch(`${RestCountriesManager.baseUrl}/all?fields=languages,cca2`);
        if (!response.ok) {
            console.error(await response.text());
            throw new Error("unable to load language codes");
        }
        const allCountryCode: CountryResponse[] = await response.json();

        // Remove english from countries where it is official, but not primary
        const transformedCountryCode = allCountryCode.map(country => {
            if (this.englishNotPrimary.includes(country.cca2)) {
                if (country.languages && country.languages.eng) {
                    delete country.languages.eng;
                }
            }
            return country;
        });

        for (const countryResponse of transformedCountryCode) {
            this.countryCodes.set(countryResponse.cca2, {
                languages: countryResponse.languages,
            });
        }
    }
}
