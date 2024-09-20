import { HexColorString } from "discord.js";
import { InteractionType } from "./enums/InteractionType.js";
import { FlagModel } from "./DB/guild/Flag.model.js";
import { LanguageModel } from "./DB/guild/Language.model.js";
import { NationalityModel } from "./DB/guild/Nationality.model.js";
import SETTING from "./enums/Settings.js";

export type Country = {
    languages: Languages;
    cca2: string;
    flags: Flags;
    name: Name;
    flag: string;
    demonyms: Demonyms;
};

export type Demonyms = {
    [type: string]: Gender;
};

export type Gender = {
    f: string;
    m: string;
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
    flag: string;
    demonym?: string;
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

export type ModelTypeMapping = {
    [InteractionType.FLAG]: FlagModel;
    [InteractionType.LANGUAGE]: LanguageModel;
    [InteractionType.NATIONALITY]: NationalityModel;
};

export type SettingsMap = Map<SETTING, string>;
