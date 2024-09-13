export type CountryResponse = {
    languages: Languages;
    cca2: string;
};

export type Country = Omit<CountryResponse, "cca2">;

export type Languages = {
    [language: string]: string;
};

export type NativeName = {
    spa: Translation;
};

export type Translation = {
    official: string;
    common: string;
};

export type CountryLanguage = {
    code: string;
    name: string;
};
