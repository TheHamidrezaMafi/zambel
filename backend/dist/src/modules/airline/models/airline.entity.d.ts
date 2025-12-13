export declare class Airline {
    id: number;
    code: string;
    name_fa: string;
    name_en: string;
    logo_url: string;
    created_at: Date;
    updated_at: Date;
    get persian_name(): string;
    get english_name(): string;
    get iata_code(): string;
}
