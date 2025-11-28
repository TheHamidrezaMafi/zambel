import { DynamicModule } from '@nestjs/common';
export interface ConfigModuleOptions {
    folder: string;
}
export declare class ConfigCustomModule {
    static register(options: ConfigModuleOptions): DynamicModule;
}
