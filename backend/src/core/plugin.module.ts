import { DynamicModule, Logger, Module } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export const PLUGIN_PATH = path.normalize(
  path.join(process.cwd(), '/dist/src/modules'),
);

@Module({
  controllers: [],
})
export class PluginModule {
  public static pluginsArray: Plugin[] = [];

  public static async registerPluginsAsync(): Promise<DynamicModule> {
    const loadedPlugins: Array<DynamicModule | Promise<DynamicModule>> = [];
    this.searchPluginsInFolder(PLUGIN_PATH).forEach((filePath) => {
      if (filePath.indexOf('chats.module.js') <= -1)
        {
          loadedPlugins.push(
            this.loadPlugin(filePath).then((module) => module as DynamicModule),
          );
        }
    });

    const allPlugins = await Promise.all(loadedPlugins);
    if (allPlugins.length > 0) {
      allPlugins.forEach((module) => {
        const foundModuleEntryName = Object.keys(module).find((key) =>
          key.indexOf('Module'),
        );
        if (foundModuleEntryName) {
          this.pluginsArray.push({
            name: foundModuleEntryName,
            module: module[foundModuleEntryName],
          });
          Logger.log(`✅ Module loaded: ${foundModuleEntryName}`);
        }
      });
    }

    return {
      module: PluginModule,
      imports: [...this.pluginsArray.map((plugin) => plugin.module)],
      exports: [...this.pluginsArray.map((plugin) => plugin.module)],
    };
  }

  private static async loadPlugin(pluginPath: string): Promise<DynamicModule> {
    try {
      const module = await import(pluginPath);
      return module;
    } catch (error) {
      Logger.error(`❌ Failed to load plugin from ${pluginPath}`, error);
      throw error;
    }
  }

  private static searchPluginsInFolder(folder: string): string[] {
    return this.recFindByExt(folder, 'module.js');
  }

  private static recFindByExt(
    base: string,
    ext: string,
    files?: string[],
    result?: string[],
  ): any[] {
    files = files || fs.readdirSync(base);
    result = result || [];

    files.forEach((file) => {
      const newbase = path.join(base, file);
      if (fs.statSync(newbase).isDirectory()) {
        result = this.recFindByExt(
          newbase,
          ext,
          fs.readdirSync(newbase),
          result,
        );
      } else {
        if (file.endsWith(`.${ext}`)) {
          result.push(newbase);
        }
      }
    });
    return result;
  }
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
