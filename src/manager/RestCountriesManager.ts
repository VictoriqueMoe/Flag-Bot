import {singleton} from "tsyringe";
import fetch from 'node-fetch';
import {Country, CountryLanguage} from "../model/typeings.js";
import {ArrayUtils} from "../utils/Utils.js";

@singleton()
export class RestCountriesManager {

    private static readonly baseUrl = `${process.env.REST_COUNTRIES_API}/v3.1`;

    public async getCountryIfo(countryCode: string): Promise<Country[] | null> {
        const response = await fetch(`${RestCountriesManager.baseUrl}/alpha/${countryCode}`);
        if (!response.ok) {
            return null;
        }
        return (await response.json()) as Country[];
    }

    public async getCountyLanguages(countryCode: string): Promise<CountryLanguage[] | null> {
        const countries = await this.getCountryIfo(countryCode);
        if (!ArrayUtils.isValidArray(countries)) {
            return null;
        }
        const country = countries[0];
        const retArr: CountryLanguage[] = [];
        for (const code in country.languages) {
            const name = country.languages[code];
            retArr.push({
                code,
                name
            });
        }
        return retArr;
    }

}
