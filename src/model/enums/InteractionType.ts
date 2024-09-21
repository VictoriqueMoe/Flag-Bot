export enum InteractionType {
    FLAG,
    LANGUAGE,
    NATIONALITY,
}

export function asString(type: InteractionType): string {
    switch (type) {
        case InteractionType.NATIONALITY:
            return "Nationality";
        case InteractionType.FLAG:
            return "Residence";
        case InteractionType.LANGUAGE:
            return "Language";
    }
}
