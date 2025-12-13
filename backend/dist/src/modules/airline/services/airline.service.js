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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirlineService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const airline_entity_1 = require("../models/airline.entity");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let AirlineService = class AirlineService {
    constructor(airlineRepository) {
        this.airlineRepository = airlineRepository;
        this.logoMap = {};
        this.loadLogoMap();
    }
    loadLogoMap() {
        try {
            const possiblePaths = [
                path.join(__dirname, '../../assets/logos/logo-map.json'),
                path.join(__dirname, '../../../assets/logos/logo-map.json'),
                path.join(process.cwd(), 'dist/assets/logos/logo-map.json'),
                path.join(process.cwd(), 'src/assets/logos/logo-map.json'),
            ];
            for (const logoMapPath of possiblePaths) {
                if (fs.existsSync(logoMapPath)) {
                    this.logoMap = JSON.parse(fs.readFileSync(logoMapPath, 'utf-8'));
                    console.log(`✅ Loaded ${Object.keys(this.logoMap).length} airline logos from: ${logoMapPath}`);
                    return;
                }
            }
            console.warn('⚠️ Logo map file not found in any expected location');
        }
        catch (error) {
            console.warn('⚠️ Could not load logo map, will use database URLs:', error);
        }
    }
    getLocalLogoUrl(airline) {
        if (airline.iata_code && this.logoMap[airline.iata_code]) {
            const relativePath = this.logoMap[airline.iata_code].replace('./', '/');
            const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
            return `${backendUrl}${relativePath}`;
        }
        return airline.logo_url || '';
    }
    async getAllAirlines(page = 1, limit = 10, filters) {
        const offset = (page - 1) * limit;
        const query = this.airlineRepository.createQueryBuilder('airline');
        if (filters.persian_name || filters['name_fa']) {
            const nameFa = filters.persian_name || filters['name_fa'];
            query.andWhere('LOWER(airline.name_fa) LIKE LOWER(:name_fa)', {
                name_fa: `%${nameFa}%`,
            });
        }
        if (filters.english_name || filters['name_en']) {
            const nameEn = filters.english_name || filters['name_en'];
            query.andWhere('LOWER(airline.name_en) LIKE LOWER(:name_en)', {
                name_en: `%${nameEn}%`,
            });
        }
        if (filters.iata_code || filters['code']) {
            const code = filters.iata_code || filters['code'];
            query.andWhere('LOWER(airline.code) LIKE LOWER(:code)', {
                code: `%${code}%`,
            });
        }
        const [data, total] = await query
            .take(limit)
            .skip(offset)
            .orderBy('airline.id', 'ASC')
            .getManyAndCount();
        const dataWithLocalLogos = data.map(airline => (Object.assign(Object.assign({}, airline), { logo_url: this.getLocalLogoUrl(airline), original_logo_url: airline.logo_url })));
        return {
            data: dataWithLocalLogos,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
        };
    }
};
exports.AirlineService = AirlineService;
exports.AirlineService = AirlineService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(airline_entity_1.Airline)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AirlineService);
//# sourceMappingURL=airline.service.js.map