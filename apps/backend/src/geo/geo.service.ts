import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';

type Settlement = {
  id: number;
  name: string;
  nameUk?: string;
  nameRu?: string;
  admin1?: string;
  admin2?: string;
  lat: number;
  lon: number;
  population: number;
  featureCode: string;
  timezone?: string;
  alt: string[];
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

@Injectable()
export class GeoService {
  private readonly settlements: Settlement[];

  constructor() {
    const file = path.resolve(
      process.cwd(),
      'apps/backend/data/geo/ua.settlements.json',
    );
    if (!fs.existsSync(file)) {
      this.settlements = [];
      return;
    }
    this.settlements = JSON.parse(
      fs.readFileSync(file, 'utf8'),
    ) as Settlement[];
  }

  searchUaSettlements(q: string, limit = 20) {
    const query = norm(q);
    if (!query) return [];

    const res: Settlement[] = [];
    for (const s of this.settlements) {
      // матчим по name + uk/ru + alt
      if (
        norm(s.name).includes(query) ||
        (s.nameUk && norm(s.nameUk).includes(query)) ||
        (s.nameRu && norm(s.nameRu).includes(query)) ||
        s.alt.some((a) => norm(a).includes(query))
      ) {
        res.push(s);
        if (res.length >= limit) break;
      }
    }

    return res.map((s) => ({
      id: s.id,
      name: s.name,
      nameUk: s.nameUk,
      nameRu: s.nameRu,
      admin1: s.admin1,
      admin2: s.admin2,
      lat: s.lat,
      lon: s.lon,
      population: s.population,
      featureCode: s.featureCode,
    }));
  }
}
