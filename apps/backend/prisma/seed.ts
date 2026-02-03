import 'dotenv/config';
import { prisma, prismaDisconnect } from '../src/db/prisma';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function isoDatePlusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  const u1 = await prisma.user.upsert({
    where: { id: 'u1' },
    update: {
      bankId: 'BANK-u1',
      firstName: 'Artem',
      lastName: 'Bilousov',
      phone: '+45 00 00 00 01',
      rating: 4.8,
    },
    create: {
      id: 'u1',
      bankId: 'BANK-u1',
      firstName: 'Artem',
      lastName: 'Bilousov',
      phone: '+45 00 00 00 01',
      rating: 4.8,
    },
  });

  await prisma.user.upsert({
    where: { id: 'u2' },
    update: {
      bankId: 'BANK-u2',
      firstName: 'Anastasiia',
      lastName: 'Bilousova',
      phone: '+45 00 00 00 02',
      rating: 4.9,
    },
    create: {
      id: 'u2',
      bankId: 'BANK-u2',
      firstName: 'Anastasiia',
      lastName: 'Bilousova',
      phone: '+45 00 00 00 02',
      rating: 4.9,
    },
  });

  const cities = [
    { geonameId: 703448, name: 'Kyiv', nameUk: 'Київ' },
    { geonameId: 702550, name: 'Lviv', nameUk: 'Львів' },
    { geonameId: 710719, name: 'Cherkasy', nameUk: 'Черкаси' },
    { geonameId: 706483, name: 'Kharkiv', nameUk: 'Харків' },
  ];

  const buildingTypes = ['apartment', 'house', 'studio'] as const;
  const rentTypes = ['long', 'short'] as const;

  const total = 40;

  for (let i = 1; i <= total; i++) {
    const city = pick(cities);

    await prisma.listing.create({
      data: {
        title: `Listing #${i}`,
        address: `Street ${randInt(1, 100)}, ${city.nameUk}`,
        city,
        price: randInt(250, 1600) * 10,
        area: randInt(18, 120),
        rooms: randInt(1, 5),
        buildingType: pick([...buildingTypes]),
        rentType: pick([...rentTypes]),
        availableFrom:
          Math.random() < 0.4
            ? isoDatePlusDays(0)
            : isoDatePlusDays(randInt(1, 60)),
        kitchen: Math.random() < 0.7,
        pets: Math.random() < 0.3,
        lift: Math.random() < 0.6,
        parking: Math.random() < 0.5,
        furnished: Math.random() < 0.4,
        balcony: Math.random() < 0.5,
        storage: Math.random() < 0.4,
      },
    });
  }

  const some = await prisma.listing.findMany({ take: 6, select: { id: true } });
  for (const l of some) {
    await prisma.favorite.upsert({
      where: { userId_listingId: { userId: u1.id, listingId: l.id } },
      update: {},
      create: { userId: u1.id, listingId: l.id },
    });
  }

  console.log(
    `Seeded: users(u1,u2), listings(${total}), favorites(${some.length}) for u1`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaDisconnect();
  });
