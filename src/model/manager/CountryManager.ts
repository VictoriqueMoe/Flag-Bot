import {singleton} from "tsyringe";
import emojiUnicode from "emoji-unicode";
import countryFlagEmoji from "country-flag-emoji";
import {ObjectUtil} from "../../utils/Utils.js";

@singleton()
export class CountryManager {
    public getAlpha2Code(flagEmoji: string): string | null {
        const alpha2Code = this.getCountryFromFlag(flagEmoji);
        if (!ObjectUtil.validString(alpha2Code)) {
            return null;
        }
        return alpha2Code;
    }

    private getCountryFromFlag(flag: string): string {
        const unicode = "U+" + emojiUnicode(flag).toUpperCase().split(" ").join(" U+");
        for (const countryData of countryFlagEmoji.list) {
            if (countryData.unicode === unicode) {
                return countryData.code;
            }
        }
        return null;
    }
}
