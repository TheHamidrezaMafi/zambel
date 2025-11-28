"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var PluginModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginModule = exports.PLUGIN_PATH = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
exports.PLUGIN_PATH = path.normalize(path.join(process.cwd(), '/dist/src/modules'));
let PluginModule = PluginModule_1 = class PluginModule {
    static async registerPluginsAsync() {
        const loadedPlugins = [];
        this.searchPluginsInFolder(exports.PLUGIN_PATH).forEach((filePath) => {
            if (filePath.indexOf('chats.module.js') <= -1) {
                loadedPlugins.push(this.loadPlugin(filePath).then((module) => module));
            }
        });
        const allPlugins = await Promise.all(loadedPlugins);
        if (allPlugins.length > 0) {
            allPlugins.forEach((module) => {
                const foundModuleEntryName = Object.keys(module).find((key) => key.indexOf('Module'));
                if (foundModuleEntryName) {
                    this.pluginsArray.push({
                        name: foundModuleEntryName,
                        module: module[foundModuleEntryName],
                    });
                    common_1.Logger.log(`✅ Module loaded: ${foundModuleEntryName}`);
                }
            });
        }
        return {
            module: PluginModule_1,
            imports: [...this.pluginsArray.map((plugin) => plugin.module)],
            exports: [...this.pluginsArray.map((plugin) => plugin.module)],
        };
    }
    static async loadPlugin(pluginPath) {
        try {
            const module = await Promise.resolve(`${pluginPath}`).then(s => __importStar(require(s)));
            return module;
        }
        catch (error) {
            common_1.Logger.error(`❌ Failed to load plugin from ${pluginPath}`, error);
            throw error;
        }
    }
    static searchPluginsInFolder(folder) {
        return this.recFindByExt(folder, 'module.js');
    }
    static recFindByExt(base, ext, files, result) {
        files = files || fs.readdirSync(base);
        result = result || [];
        files.forEach((file) => {
            const newbase = path.join(base, file);
            if (fs.statSync(newbase).isDirectory()) {
                result = this.recFindByExt(newbase, ext, fs.readdirSync(newbase), result);
            }
            else {
                if (file.endsWith(`.${ext}`)) {
                    result.push(newbase);
                }
            }
        });
        return result;
    }
};
exports.PluginModule = PluginModule;
PluginModule.pluginsArray = [];
exports.PluginModule = PluginModule = PluginModule_1 = __decorate([
    (0, common_1.Module)({
        controllers: [],
    })
], PluginModule);
//# sourceMappingURL=plugin.module.js.map