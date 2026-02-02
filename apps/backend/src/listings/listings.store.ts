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
  // seed-objects
];
