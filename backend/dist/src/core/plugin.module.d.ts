import { DynamicModule } from '@nestjs/common';
export declare const PLUGIN_PATH: string;
export declare class PluginModule {
    static pluginsArray: Plugin[];
    static registerPluginsAsync(): Promise<DynamicModule>;
    private static loadPlugin;
    private static searchPluginsInFolder;
    private static recFindByExt;
}
export interface PluginConfig {
    name: string;
    version: string;
    description: string;
    file: string;
    entryClass: string;
}
interface Plugin {
    name: string;
    module: DynamicModule;
}
export {};
