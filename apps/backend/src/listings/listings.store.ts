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

  area: number | null;
  rooms: number | null;

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
    id: 'seed-1',
    title: '1-кімн. квартира біля метро',
    price: 12000,
    city: {
      geonameId: 703448,
      name: 'Kyiv',
      nameUk: 'Київ',
      lat: 50.4501,
      lon: 30.5234,
    },
    address: 'вул. Хрещатик, 10',
    description: 'Світла квартира, з меблями. Поруч транспорт і магазини.',
    images: [],
    ownerId: 'seed-owner-1',
    status: 'ACTIVE',
    buildingType: 'new',
    rentType: 'long',
    area: 42,
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
    id: 'seed-2',
    title: 'Подобова студія в центрі',
    price: 1800,
    city: {
      geonameId: 703448,
      name: 'Kyiv',
      nameUk: 'Київ',
      lat: 50.4501,
      lon: 30.5234,
    },
    address: 'вул. Саксаганського, 25',
    description: 'Ідеально для відряджень, швидкий Wi-Fi.',
    images: [],
    ownerId: 'seed-owner-2',
    status: 'ACTIVE',
    buildingType: 'old',
    rentType: 'daily',
    area: 28,
    rooms: 1,
    availableFrom: '2026-02-02',
    kitchen: false,
    pets: false,
    lift: false,
    parking: false,
    furnished: true,
    balcony: false,
    storage: false,
  },
  {
    id: 'seed-3',
    title: '2-кімн. з балконом, можна з тваринами',
    price: 16000,
    city: {
      geonameId: 702550,
      name: 'Lviv',
      nameUk: 'Львів',
      lat: 49.8397,
      lon: 24.0297,
    },
    address: 'вул. Городоцька, 90',
    description: 'Затишно, теплий будинок, поряд парк.',
    images: [],
    ownerId: 'seed-owner-1',
    status: 'ACTIVE',
    buildingType: 'old',
    rentType: 'long',
    area: 58,
    rooms: 2,
    availableFrom: '2026-02-10',
    kitchen: true,
    pets: true,
    lift: false,
    parking: true,
    furnished: false,
    balcony: true,
    storage: true,
  },
];
