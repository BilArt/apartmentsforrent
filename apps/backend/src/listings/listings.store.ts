export type City = {
  geonameId: number;
  name: string;
  nameUk?: string;
  admin1?: string;
  admin2?: string;
  lat: number;
  lon: number;
};

export type Listing = {
  id: string;
  title: string;
  price: number;
  city: City;
  address: string;
  description: string;
  images: string[];
  ownerId: string;
};

export const listings: Listing[] = [
  {
    id: 'l1',
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
    price: 1000,
    images: ['placeholder-1.jpg'],
    ownerId: 'seed-owner-1',
  },
  {
    id: 'l2',
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
  },
];
