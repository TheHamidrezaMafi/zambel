export declare class Airport {
    id: number;
    code: string;
    name_en: string;
    name_fa: string;
    city_code: string;
    city_name_en: string;
    city_name_fa: string;
    country: string;
    created_at: Date;
    get iata_code(): string;
    get icao_code(): string;
    get persian_name(): string;
    get english_name(): string;
    get country_code(): string;
}
