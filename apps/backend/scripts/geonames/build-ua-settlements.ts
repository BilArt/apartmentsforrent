import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';

/**
 * GeoNames dump columns (TSV):
 * 0 geonameid
 * 1 name
 * 2 asciiname
 * 3 alternatenames (comma-separated)
 * 4 latitude
 * 5 longitude
 * 6 feature class
 * 7 feature code
 * 8 country code
 * 9 cc2
 * 10 admin1 code
 * 11 admin2 code
 * 12 admin3 code
 * 13 admin4 code
 * 14 population
 * 15 elevation
 * 16 dem
 * 17 timezone
 * 18 modification date
 */

type Settlement = {
  id: number; // geonameid
  name: string; // Latin name (name)
  nameUk?: string; // Ukrainian best guess
  nameRu?: string; // Russian best guess
  admin1?: string; // oblast code (admin1)
  admin2?: string; // raion code (admin2)
  lat: number;
  lon: number;
  population: number;
  featureCode: string; // PPL / PPLC / etc
  timezone?: string;
  alt: string[]; // alternatenames split (limited)
};

function pickLangName(alts: string[], regexes: RegExp[]): string | undefined {
  for (const r of regexes) {
    const hit = alts.find((a) => r.test(a));
    if (hit) return hit;
  }
  return undefined;
}

function uniqLimit(arr: string[], limit = 40): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of arr) {
    const v = s.trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
    if (out.length >= limit) break;
  }
  return out;
}

async function main() {
  const input = path.resolve(
    process.cwd(),
    'apps/backend/data/geonames/UA.txt',
  );
  const outDir = path.resolve(process.cwd(), 'apps/backend/data/geo');
  const output = path.join(outDir, 'ua.settlements.json');

  if (!fs.existsSync(input)) {
    console.error(`UA.txt not found: ${input}`);
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });

  const rl = readline.createInterface({
    input: fs.createReadStream(input, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  const result: Settlement[] = [];

  let count = 0;
  for await (const line of rl) {
    count++;
    if (!line || line.startsWith('#')) continue;

    const parts = line.split('\t');
    if (parts.length < 19) continue;

    const featureClass = parts[6];
    const featureCode = parts[7];
    const country = parts[8];

    // Only populated places in Ukraine
    if (country !== 'UA') continue;
    if (featureClass !== 'P') continue;

    const id = Number(parts[0]);
    const name = parts[1];
    const altsRaw = parts[3] || '';
    const lat = Number(parts[4]);
    const lon = Number(parts[5]);
    const admin1 = parts[10] || undefined;
    const admin2 = parts[11] || undefined;
    const population = Number(parts[14] || 0);
    const timezone = parts[17] || undefined;

    if (!Number.isFinite(id) || !name) continue;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const alts = uniqLimit(altsRaw.split(','), 50);

    const nameUk = pickLangName(alts, [/[іїєґ]/i, /^[А-ЯІЇЄҐа-яіїєґ' -]+$/u]);
    const nameRu = pickLangName(alts, [/^[А-Яа-яЁё' -]+$/u]);

    result.push({
      id,
      name,
      nameUk,
      nameRu,
      admin1,
      admin2,
      lat,
      lon,
      population: Number.isFinite(population) ? population : 0,
      featureCode,
      timezone,
      alt: alts,
    });

    if (result.length % 50000 === 0) {
      console.log(`Parsed ${result.length} settlements... (line ${count})`);
    }
  }

  result.sort((a, b) => {
    if (b.population !== a.population) return b.population - a.population;
    return a.name.localeCompare(b.name);
  });

  fs.writeFileSync(output, JSON.stringify(result));
  console.log(`✅ Saved: ${output}`);
  console.log(`Total settlements: ${result.length}`);

  const license = path.join(outDir, 'README-GEONAMES.txt');
  fs.writeFileSync(
    license,
    `Data source: GeoNames (https://www.geonames.org/) - CC BY 4.0\nDownloaded from: https://download.geonames.org/export/dump/\nFile: UA.txt\n`,
  );
  console.log(`✅ Saved: ${license}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
