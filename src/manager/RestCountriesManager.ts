import { singleton } from "tsyringe";
import fetch from "node-fetch";
import { Country, CountryLanguage } from "../model/typeings.js";

@singleton()
export class RestCountriesManager {
    private static readonly baseUrl = `https://restcountries.com/v3.1`;

    public async getCountryIfo(countryCode: string): Promise<Country[]> {
        const response = await fetch(`${RestCountriesManager.baseUrl}/alpha/${countryCode}`);
        if (!response.ok) {
            return [];
        }
        return (await response.json()) as Country[];
    }

    public async getCountyLanguages(countryCode: string): Promise<CountryLanguage[]> {
        const countries = await this.getCountryIfo(countryCode);
        if (countries.length === 0) {
            return [];
        }
        const country = countries[0];
        const retArr: CountryLanguage[] = [];
        for (const code in country.languages) {
            const name = country.languages[code];
            retArr.push({
                code,
                name,
            });
        }
        return retArr;
    }
}
