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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const airline_entity_1 = require("../src/modules/airline/models/airline.entity");
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const promises_1 = require("stream/promises");
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: 'chogolisa.liara.cloud',
    port: 34352,
    username: 'root',
    password: 'rWWZ82a4rQn5oBJEnIK9tEBk',
    database: 'postgres',
    entities: [airline_entity_1.Airline],
    synchronize: false,
});
const OUTPUT_DIR = path.join(__dirname, '../src/assets/logos/airlines');
const MAPPING_PATH = path.join(__dirname, '../src/assets/logos/logo-map.json');
const FALLBACK_SOURCES = [
    (iataCode) => `https://cdn.alibaba.ir/static/img/airlines/Domestic/${iataCode}.png`,
    (iataCode) => `https://images.kiwi.com/airlines/64/${iataCode}.png`,
    (iataCode) => `https://pics.avs.io/200/200/${iataCode}.png`,
    (iataCode) => `https://content.airhex.com/content/logos/airlines_${iataCode}_200_200_s.png`,
];
async function downloadImage(url, filename) {
    const filepath = path.join(OUTPUT_DIR, filename);
    const response = await axios_1.default.get(url, { responseType: 'stream', timeout: 10000 });
    await (0, promises_1.pipeline)(response.data, fs.createWriteStream(filepath));
}
async function tryDownloadFromMultipleSources(iataCode, primaryUrl, filename) {
    try {
        await downloadImage(primaryUrl, filename);
        console.log(`✅ Downloaded from primary source: ${filename}`);
        return true;
    }
    catch (primaryError) {
        console.warn(`⚠️  Primary source failed for ${iataCode}, trying fallbacks...`);
    }
    for (let i = 0; i < FALLBACK_SOURCES.length; i++) {
        const fallbackUrl = FALLBACK_SOURCES[i](iataCode);
        try {
            await downloadImage(fallbackUrl, filename);
            console.log(`✅ Downloaded from fallback ${i + 1}: ${filename}`);
            return true;
        }
        catch (fallbackError) {
        }
    }
    console.error(`❌ All sources failed for ${iataCode}`);
    return false;
}
async function run() {
    await AppDataSource.initialize();
    const airlineRepo = AppDataSource.getRepository(airline_entity_1.Airline);
    const airlines = await airlineRepo.find();
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    const existingMap = fs.existsSync(MAPPING_PATH)
        ? JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf-8'))
        : {};
    const updatedMap = {};
    const failedAirlines = [];
    for (const airline of airlines) {
        if (!airline.logo_url || !airline.iata_code)
            continue;
        const ext = path.extname(airline.logo_url).split('?')[0] || '.png';
        const safeFilename = `${airline.iata_code}${ext}`.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const filepath = path.join(OUTPUT_DIR, safeFilename);
        const currentLogoPath = `./assets/logos/airlines/${safeFilename}`;
        const hasChanged = existingMap[airline.iata_code] !== currentLogoPath;
        if (!fs.existsSync(filepath) || hasChanged) {
            if (existingMap[airline.iata_code] &&
                existingMap[airline.iata_code] !== currentLogoPath) {
                const oldFilePath = path.join(__dirname, '../src', existingMap[airline.iata_code]);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                    console.log(`🗑️ Deleted old logo for ${airline.iata_code}`);
                }
            }
            const success = await tryDownloadFromMultipleSources(airline.iata_code, airline.logo_url, safeFilename);
            if (!success) {
                failedAirlines.push(airline.iata_code);
                continue;
            }
        }
        updatedMap[airline.iata_code] = currentLogoPath;
    }
    fs.writeFileSync(MAPPING_PATH, JSON.stringify(updatedMap, null, 2));
    console.log('\\n🎉 Logo download process completed!');
    console.log(`✅ Successfully processed: ${Object.keys(updatedMap).length} airlines`);
    if (failedAirlines.length > 0) {
        console.log(`\\n⚠️  Failed to download logos for ${failedAirlines.length} airlines:`);
        console.log(failedAirlines.join(', '));
    }
    await AppDataSource.destroy();
}
run().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=download-airline-logos.js.map