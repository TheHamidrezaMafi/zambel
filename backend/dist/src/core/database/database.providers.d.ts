import { DataSource } from 'typeorm';
export declare const typeOrmDatabaseProviders: {
    provide: string;
    useFactory: () => Promise<DataSource>;
}[];
