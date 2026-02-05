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

function norm(v: unknown): string {
  if (typeof v === 'string') return v.trim().toLowerCase();
  if (typeof v === 'number' && Number.isFinite(v))
    return String(v).trim().toLowerCase();
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return '';
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

function isSettlement(v: unknown): v is Settlement {
  if (typeof v !== 'object' || v === null) return false;

  const o = v as Record<string, unknown>;

  if (typeof o.id !== 'number' || !Number.isFinite(o.id)) return false;
  if (typeof o.name !== 'string') return false;
  if (typeof o.lat !== 'number' || !Number.isFinite(o.lat)) return false;
  if (typeof o.lon !== 'number' || !Number.isFinite(o.lon)) return false;

  if (o.population != null && typeof o.population !== 'number') return false;
  if (o.featureCode != null && typeof o.featureCode !== 'string') return false;

  if (o.alt != null && !isStringArray(o.alt)) return false;

  return true;
}

function normalizeSettlement(s: Settlement): Settlement {
  return {
    ...s,
    nameUk: typeof s.nameUk === 'string' ? s.nameUk : undefined,
    nameRu: typeof s.nameRu === 'string' ? s.nameRu : undefined,
    admin1: typeof s.admin1 === 'string' ? s.admin1 : undefined,
    admin2: typeof s.admin2 === 'string' ? s.admin2 : undefined,
    population:
      typeof s.population === 'number' && Number.isFinite(s.population)
        ? s.population
        : 0,
    featureCode: typeof s.featureCode === 'string' ? s.featureCode : '',
    alt: Array.isArray(s.alt) ? s.alt.filter((x) => typeof x === 'string') : [],
  };
}

function tryReadJson(filePath: string): Settlement[] | null {
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = safeJsonParse(raw);

  if (!Array.isArray(parsed)) return null;

  const items: Settlement[] = [];
  for (const x of parsed) {
    if (isSettlement(x)) items.push(normalizeSettlement(x));
  }

  return items;
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

    const fileUsed = loaded
      ? fs.existsSync(candidate1)
        ? candidate1
        : fs.existsSync(candidate2)
          ? candidate2
          : candidate3
      : 'NOT FOUND';

    // eslint-disable-next-line no-console
    console.log(
      `[GeoService] loaded settlements: ${this.settlements.length} (file: ${fileUsed})`,
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

      const pa = Number.isFinite(a.population) ? a.population : 0;
      const pb = Number.isFinite(b.population) ? b.population : 0;
      if (pa !== pb) return pb - pa;

      const an = norm(a.nameUk || a.name);
      const bn = norm(b.nameUk || b.name);
      return an.localeCompare(bn);
    });

    const n = Math.max(1, Math.min(50, Number(limit) || 20));

    return candidates.slice(0, n).map((s) => ({
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
