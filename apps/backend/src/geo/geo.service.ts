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

function norm(s: unknown) {
  return String(s || '')
    .trim()
    .toLowerCase();
}

function tryReadJson(filePath: string): Settlement[] | null {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as Settlement[]) : null;
}

function featureRank(code?: string) {
  switch (code) {
    case 'PPLC':
      return 0;
    case 'PPLA':
      return 1;
    case 'PPLA2':
      return 2;
    case 'PPLA3':
      return 3;
    case 'PPLA4':
      return 4;
    case 'PPL':
      return 5;
    case 'PPLG':
      return 6;
    case 'PPLS':
      return 7;
    case 'PPLX':
      return 8;
    default:
      return 50;
  }
}

@Injectable()
export class GeoService {
  private readonly settlements: Settlement[];

  constructor() {
    const candidate1 = path.resolve(
      process.cwd(),
      'data/geo/ua.settlements.json',
    );
    const candidate2 = path.resolve(
      process.cwd(),
      'apps/backend/data/geo/ua.settlements.json',
    );
    const candidate3 = path.resolve(
      __dirname,
      '../../../data/geo/ua.settlements.json',
    );

    const loaded =
      tryReadJson(candidate1) ??
      tryReadJson(candidate2) ??
      tryReadJson(candidate3);

    this.settlements = loaded ?? [];

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

    const candidates: Settlement[] = [];

    for (const s of this.settlements) {
      const nName = norm(s.name);
      const nUk = norm(s.nameUk);
      const nRu = norm(s.nameRu);
      const alt = Array.isArray(s.alt) ? s.alt : [];

      const hit =
        nName.includes(query) ||
        (nUk && nUk.includes(query)) ||
        (nRu && nRu.includes(query)) ||
        alt.some((a) => norm(a).includes(query));

      if (hit) candidates.push(s);
    }

    const isExact = (s: Settlement) => {
      const nName = norm(s.name);
      const nUk = norm(s.nameUk);
      const nRu = norm(s.nameRu);
      return nUk === query || nName === query || nRu === query;
    };

    const isStarts = (s: Settlement) => {
      const nName = norm(s.name);
      const nUk = norm(s.nameUk);
      const nRu = norm(s.nameRu);
      return (
        (nUk && nUk.startsWith(query)) ||
        nName.startsWith(query) ||
        (nRu && nRu.startsWith(query))
      );
    };

    candidates.sort((a, b) => {
      const ea = isExact(a) ? 1 : 0;
      const eb = isExact(b) ? 1 : 0;
      if (ea !== eb) return eb - ea;

      const sa = isStarts(a) ? 1 : 0;
      const sb = isStarts(b) ? 1 : 0;
      if (sa !== sb) return sb - sa;

      const fa = featureRank(a.featureCode);
      const fb = featureRank(b.featureCode);
      if (fa !== fb) return fa - fb;

      const pa = Number(a.population || 0);
      const pb = Number(b.population || 0);
      if (pa !== pb) return pb - pa;

      const an = norm(a.nameUk || a.name);
      const bn = norm(b.nameUk || b.name);
      return an.localeCompare(bn);
    });

    return candidates.slice(0, limit).map((s) => ({
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
