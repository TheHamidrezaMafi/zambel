import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { CONFIG_OPTIONS } from './constants';

export interface ConfigModuleOptions {
    folder: string;
}

@Module({})
export class ConfigCustomModule {
    static register(options: ConfigModuleOptions): DynamicModule {
        return {
            module: ConfigCustomModule,
            providers: [
                {
                    provide: CONFIG_OPTIONS,
                    useValue: options,
                },
                ConfigService,
            ],
            exports: [ConfigService],
        };
    }
}