export type City = {
  geonameId: number;
  name: string;
  nameUk?: string;
  admin1?: string;
  admin2?: string;
  lat: number;
  lon: number;
};

export type ListingStatus = 'ACTIVE' | 'HIDDEN';
export type BuildingType = 'old' | 'new';
export type RentType = 'long' | 'daily';

export type Listing = {
  id: string;

  title: string;
  price: number;

  city: City;
  address: string;
  description: string;

  images: string[];

  ownerId: string;
  status: ListingStatus;

  buildingType: BuildingType;
  rentType: RentType;

  area: number;
  rooms: number;

  availableFrom: string;

  kitchen: boolean;
  pets: boolean;
  lift: boolean;
  parking: boolean;
  furnished: boolean;
  balcony: boolean;
  storage: boolean;
};

export const listings: Listing[] = [
  {
    id: '8a1b2c3d-1111-2222-3333-444455556666',
    title: 'Сонячна студія біля метро Лукʼянівська',
    city: {
      geonameId: 703448,
      name: 'Kyiv',
      nameUk: 'Київ',
      admin1: '12',
      lat: 50.45466,
      lon: 30.5238,
    },
    address: 'вул. Дегтярівська, 12',
    description:
      'Світла студія 28 м², 7/16 поверх, тепла взимку. Поруч метро, магазини, парк.',
    price: 15000,
    images: ['placeholder-1.jpg'],
    ownerId: 'seed-owner-1',
    status: 'ACTIVE',

    buildingType: 'new',
    rentType: 'long',
    area: 28,
    rooms: 1,
    availableFrom: '2026-02-01',

    kitchen: true,
    pets: false,
    lift: true,
    parking: false,
    furnished: true,
    balcony: false,
    storage: false,
  },

  {
    id: '9b2c3d4e-7777-8888-9999-000011112222',
    title: 'Львів: 1-кімнатна біля Оперного',
    city: {
      geonameId: 702550,
      name: 'Lviv',
      nameUk: 'Львів',
      admin1: '15',
      admin2: '4606',
      lat: 49.83826,
      lon: 24.02324,
    },
    address: 'просп. Свободи, 15',
    description:
      'Самий центр. Високі стелі, історичний будинок, акуратний ремонт.',
    price: 14000,
    images: ['placeholder-2.jpg'],
    ownerId: 'seed-owner-2',
    status: 'ACTIVE',

    buildingType: 'old',
    rentType: 'long',
    area: 40,
    rooms: 1,
    availableFrom: '2026-02-10',

    kitchen: true,
    pets: true,
    lift: false,
    parking: false,
    furnished: true,
    balcony: false,
    storage: true,
  },

  {
    id: '2c0a45e6-3d9a-4d37-8f3b-19c1b54d9c01',
    title: 'Одеса: вид на море, поруч Аркадія',
    city: {
      geonameId: 698740,
      name: 'Odesa',
      nameUk: 'Одеса',
      admin1: '17',
      lat: 46.48253,
      lon: 30.72331,
    },
    address: 'Французький бульвар, 22',
    description:
      '1-кімнатна, сучасний ЖК. Пішки до моря, кондиціонер, інтернет, ліфт.',
    price: 18000,
    images: ['placeholder-3.jpg'],
    ownerId: 'seed-owner-3',
    status: 'ACTIVE',

    buildingType: 'new',
    rentType: 'daily',
    area: 36,
    rooms: 1,
    availableFrom: '2026-02-01',

    kitchen: true,
    pets: false,
    lift: true,
    parking: true,
    furnished: true,
    balcony: true,
    storage: false,
  },

  {
    id: 'c9f1a7f8-0b32-4a41-8b2e-8b86f9d9a9d2',
    title: 'Харків: 2-кімнатна біля метро Наукова',
    city: {
      geonameId: 706483,
      name: 'Kharkiv',
      nameUk: 'Харків',
      admin1: '07',
      lat: 49.9935,
      lon: 36.23038,
    },
    address: 'просп. Науки, 30',
    description: 'Дві кімнати, 54 м². Тихий двір, поряд кафе та супермаркети.',
    price: 12000,
    images: ['placeholder-1.jpg'],
    ownerId: 'seed-owner-1',
    status: 'ACTIVE',

    buildingType: 'old',
    rentType: 'long',
    area: 54,
    rooms: 2,
    availableFrom: '2026-03-01',

    kitchen: true,
    pets: true,
    lift: false,
    parking: false,
    furnished: false,
    balcony: true,
    storage: true,
  },

  {
    id: '7c31d3fb-5fd0-4b42-a2a9-5ce49a6b7d7d',
    title: 'Дніпро: новобудова, панорамні вікна',
    city: {
      geonameId: 709930,
      name: 'Dnipro',
      nameUk: 'Дніпро',
      admin1: '04',
      lat: 48.45,
      lon: 34.9833,
    },
    address: 'вул. Січеславська Набережна, 19',
    description:
      'Студія 32 м², новий ремонт, охорона, підземний паркінг (опціонально).',
    price: 16000,
    images: ['placeholder-2.jpg'],
    ownerId: 'seed-owner-4',
    status: 'ACTIVE',

    buildingType: 'new',
    rentType: 'long',
    area: 32,
    rooms: 1,
    availableFrom: '2026-02-15',

    kitchen: true,
    pets: false,
    lift: true,
    parking: true,
    furnished: true,
    balcony: false,
    storage: false,
  },

  {
    id: 'e1a2b3c4-d5e6-47f1-9a2b-3c4d5e6f7011',
    title: 'Запоріжжя: 1-кімнатна, поруч ДніпроГЕС',
    city: {
      geonameId: 687700,
      name: 'Zaporizhzhia',
      nameUk: 'Запоріжжя',
      admin1: '23',
      lat: 47.8388,
      lon: 35.1396,
    },
    address: 'просп. Соборний, 210',
    description:
      'Затишна квартира, 1 кімната. Зручна розв’язка, балкон, меблі.',
    price: 9000,
    images: ['placeholder-3.jpg'],
    ownerId: 'seed-owner-5',
    status: 'ACTIVE',

    buildingType: 'old',
    rentType: 'daily',
    area: 30,
    rooms: 1,
    availableFrom: '2026-02-01',

    kitchen: true,
    pets: true,
    lift: false,
    parking: false,
    furnished: true,
    balcony: true,
    storage: false,
  },

  {
    id: 'aa0b1c2d-3e4f-4a5b-9c6d-7e8f9a0b1c2d',
    title: 'Вінниця: тихий район, поруч парк',
    city: {
      geonameId: 689558,
      name: 'Vinnytsia',
      nameUk: 'Вінниця',
      admin1: '05',
      lat: 49.2331,
      lon: 28.4682,
    },
    address: 'вул. Пирогова, 88',
    description: '2-кімнатна, 50 м². Тепла, не кутова. Поруч парк і транспорт.',
    price: 11000,
    images: ['placeholder-1.jpg'],
    ownerId: 'seed-owner-2',
    status: 'ACTIVE',

    buildingType: 'old',
    rentType: 'long',
    area: 50,
    rooms: 2,
    availableFrom: '2026-02-20',

    kitchen: true,
    pets: true,
    lift: false,
    parking: true,
    furnished: false,
    balcony: false,
    storage: true,
  },

  {
    id: '0f1e2d3c-4b5a-6978-9a0b-1c2d3e4f5a6b',
    title: 'Івано-Франківськ: компактна студія для однієї людини',
    city: {
      geonameId: 707471,
      name: 'Ivano-Frankivsk',
      nameUk: 'Івано-Франківськ',
      admin1: '06',
      lat: 48.9226,
      lon: 24.7111,
    },
    address: 'вул. Незалежності, 44',
    description: 'Студія 24 м². Центр поруч, зручна кухня, швидкий інтернет.',
    price: 9500,
    images: ['placeholder-2.jpg'],
    ownerId: 'seed-owner-6',
    status: 'ACTIVE',

    buildingType: 'new',
    rentType: 'long',
    area: 24,
    rooms: 1,
    availableFrom: '2026-02-05',

    kitchen: true,
    pets: false,
    lift: true,
    parking: false,
    furnished: true,
    balcony: false,
    storage: false,
  },

  {
    id: '11223344-5566-7788-99aa-bbccddeeff00',
    title: 'Чернівці: історичний центр, високі стелі',
    city: {
      geonameId: 710719,
      name: 'Chernivtsi',
      nameUk: 'Чернівці',
      admin1: '03',
      lat: 48.2915,
      lon: 25.9403,
    },
    address: 'вул. Кобилянської, 10',
    description:
      '1-кімнатна в центрі. Атмосферний будинок, поряд кав’ярні та університет.',
    price: 10500,
    images: ['placeholder-3.jpg'],
    ownerId: 'seed-owner-3',
    status: 'ACTIVE',

    buildingType: 'old',
    rentType: 'daily',
    area: 35,
    rooms: 1,
    availableFrom: '2026-02-01',

    kitchen: true,
    pets: true,
    lift: false,
    parking: false,
    furnished: true,
    balcony: false,
    storage: false,
  },

  {
    id: 'fedcba98-7654-3210-ffff-eeee-ddddccccbbbb',
    title: 'Ужгород: затишно, близько до набережної',
    city: {
      geonameId: 690548,
      name: 'Uzhhorod',
      nameUk: 'Ужгород',
      admin1: '21',
      lat: 48.6208,
      lon: 22.2879,
    },
    address: 'наб. Незалежності, 7',
    description:
      '1-кімнатна, 36 м². Тепла, з балконом. До центру — 10 хв пішки.',
    price: 11500,
    images: ['placeholder-1.jpg'],
    ownerId: 'seed-owner-7',
    status: 'ACTIVE',

    buildingType: 'new',
    rentType: 'long',
    area: 36,
    rooms: 1,
    availableFrom: '2026-02-12',

    kitchen: true,
    pets: true,
    lift: true,
    parking: false,
    furnished: false,
    balcony: true,
    storage: true,
  },
];
