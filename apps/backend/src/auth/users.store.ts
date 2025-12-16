export type User = {
  id: string;
  rating: number;
  firstName: string;
  lastName: string;
  phone: string;
  bankId: string;
};

export const users: User[] = [
  {
    id: 'seed-owner-1',
    rating: 4.7,
    firstName: 'Олена',
    lastName: 'Коваль',
    phone: '+380 67 111 11 11',
    bankId: 'SEED-BANKID-1',
  },
  {
    id: 'seed-owner-2',
    rating: 4.2,
    firstName: 'Ігор',
    lastName: 'Мельник',
    phone: '+380 67 222 22 22',
    bankId: 'SEED-BANKID-2',
  },
  {
    id: 'seed-owner-3',
    rating: 4.9,
    firstName: 'Марія',
    lastName: 'Савчук',
    phone: '+380 67 333 33 33',
    bankId: 'SEED-BANKID-3',
  },
];
