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
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const promises_1 = require("stream/promises");
const OUTPUT_DIR = path.join(__dirname, '../src/assets/logos/airlines');
const MAPPING_PATH = path.join(__dirname, '../src/assets/logos/logo-map.json');
const MISSING_AIRLINES = ['atl', 'IRZ'];
const SOURCES = [
    (iataCode) => `https://cdn.alibaba.ir/static/img/airlines/Domestic/${iataCode}.png`,
    (iataCode) => `https://images.kiwi.com/airlines/64/${iataCode}.png`,
    (iataCode) => `https://pics.avs.io/200/200/${iataCode}.png`,
    (iataCode) => `https://content.airhex.com/content/logos/airlines_${iataCode}_200_200_s.png`,
];
async function downloadImage(url, filepath) {
    const response = await axios_1.default.get(url, { responseType: 'stream', timeout: 10000 });
    await (0, promises_1.pipeline)(response.data, fs.createWriteStream(filepath));
}
async function downloadMissingLogo(iataCode) {
    const filename = `${iataCode}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);
    console.log(`\nTrying to download logo for ${iataCode}...`);
    for (let i = 0; i < SOURCES.length; i++) {
        const url = SOURCES[i](iataCode);
        try {
            console.log(`  Attempting source ${i + 1}: ${url}`);
            await downloadImage(url, filepath);
            console.log(`  ✅ Successfully downloaded from source ${i + 1}`);
            return true;
        }
        catch (error) {
            console.log(`  ❌ Failed from source ${i + 1}`);
        }
    }
    console.log(`  ⚠️  All sources failed for ${iataCode}`);
    return false;
}
async function run() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    const existingMap = fs.existsSync(MAPPING_PATH)
        ? JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf-8'))
        : {};
    const successful = [];
    const failed = [];
    for (const iataCode of MISSING_AIRLINES) {
        const success = await downloadMissingLogo(iataCode);
        if (success) {
            successful.push(iataCode);
            existingMap[iataCode] = `./assets/logos/airlines/${iataCode}.png`;
        }
        else {
            failed.push(iataCode);
        }
    }
    if (successful.length > 0) {
        fs.writeFileSync(MAPPING_PATH, JSON.stringify(existingMap, null, 2));
        console.log('\n✅ Updated logo mapping file');
    }
    console.log('\n' + '='.repeat(50));
    console.log('SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully downloaded: ${successful.length}`);
    if (successful.length > 0) {
        console.log(`   ${successful.join(', ')}`);
    }
    if (failed.length > 0) {
        console.log(`❌ Failed: ${failed.length}`);
        console.log(`   ${failed.join(', ')}`);
    }
}
run().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=download-missing-logos.js.map