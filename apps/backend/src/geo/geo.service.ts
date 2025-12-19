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

function tryReadJson(filePath: string): Settlement[] | null {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as Settlement[];
}

@Injectable()
export class GeoService {
  private readonly settlements: Settlement[];

  constructor() {
    // 1) если Nest запущен из apps/backend -> cwd уже apps/backend
    const candidate1 = path.resolve(
      process.cwd(),
      'data/geo/ua.settlements.json',
    );

    // 2) если Nest запущен из корня репо -> cwd это корень
    const candidate2 = path.resolve(
      process.cwd(),
      'apps/backend/data/geo/ua.settlements.json',
    );

    // 3) fallback: относительно скомпилированного файла dist
    // dist обычно: apps/backend/dist/src/geo/geo.service.js
    const candidate3 = path.resolve(
      __dirname,
      '../../../data/geo/ua.settlements.json',
    );

    const loaded =
      tryReadJson(candidate1) ??
      tryReadJson(candidate2) ??
      tryReadJson(candidate3);

    this.settlements = loaded ?? [];

    // маленький лог (можешь убрать потом)
    // eslint-disable-next-line no-console
    console.log(
      `[GeoService] loaded settlements: ${this.settlements.length} (file: ${
        loaded
          ? fs.existsSync(candidate1)
            ? candidate1
            : fs.existsSync(candidate2)
              ? candidate2
              : candidate3
          : 'NOT FOUND'
      })`,
    );
  }

  searchUaSettlements(q: string, limit = 20) {
    const query = norm(q);
    if (!query) return [];

    // settlements уже отсортированы по population в JSON
    const res: Settlement[] = [];
    for (const s of this.settlements) {
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
