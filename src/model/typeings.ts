import { HexColorString } from "discord.js";

export type Country = {
    languages: Languages;
    cca2: string;
    flags: Flags;
    name: Name;
};

export type Languages = {
    [language: string]: string;
};

export type Translation = {
    official: string;
    common: string;
};

export type CountryInfo = {
    languageInfo: CountryLanguage[];
    primaryColour: HexColorString;
    name: Name;
    cca2: string;
};

export type Name = {
    common: string;
    official: string;
    nativeName: NativeName;
};
export type NativeName = {
    spa: Translation;
};

export type CountryLanguage = {
    code: string;
    name: string;
};

export type ColourInfo = {
    country: string;
    primaryColour: HexColorString;
};

export type Flags = {
    png: string;
    svg: string;
    alt: string;
};
