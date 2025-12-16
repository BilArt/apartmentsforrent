export type Listing = {
  id: string;
  title: string;
  city: 'Kyiv' | 'Lviv';
  address: string;
  description: string;
  images: string[]; // just empty space
  ownerId: string;
};

export const listings: Listing[] = [
  {
    id: 'l1',
    title: 'Сонячна студія біля метро Лукʼянівська',
    city: 'Kyiv',
    address: 'вул. Дегтярівська, 12',
    description:
      'Світла студія 28 м², 7/16 поверх, тепла взимку. Поруч метро, магазини, парк.',
    images: ['placeholder-1.jpg'],
    ownerId: 'seed-owner-1',
  },
  {
    id: 'l2',
    title: '1-кімнатна з видом на Дніпро',
    city: 'Kyiv',
    address: 'наб. Дніпровська, 4',
    description:
      'Затишна квартира, панорамні вікна, кондиціонер, робоче місце. Тиха секція.',
    images: ['placeholder-2.jpg'],
    ownerId: 'seed-owner-1',
  },
  {
    id: 'l3',
    title: '2-кімнатна біля КПІ',
    city: 'Kyiv',
    address: 'просп. Перемоги, 25',
    description:
      '50 м², окрема спальня, кухня-вітальня. Ідеально для пари або 1-2 людей.',
    images: ['placeholder-3.jpg'],
    ownerId: 'seed-owner-2',
  },
  {
    id: 'l4',
    title: 'Квартира поруч з Оболонською набережною',
    city: 'Kyiv',
    address: 'вул. Героїв Сталінграда, 10',
    description:
      'Чисто, тихо, поблизу вода і прогулянкова зона. Багато місць для парковки.',
    images: ['placeholder-4.jpg'],
    ownerId: 'seed-owner-2',
  },
  {
    id: 'l5',
    title: 'Стильна студія в центрі Києва',
    city: 'Kyiv',
    address: 'вул. Саксаганського, 30',
    description:
      'Невелика, але дуже продумана. Кавʼярні, транспорт, центр — все поруч.',
    images: ['placeholder-5.jpg'],
    ownerId: 'seed-owner-3',
  },

  {
    id: 'l6',
    title: 'Львів: 1-кімнатна біля Оперного',
    city: 'Lviv',
    address: 'просп. Свободи, 15',
    description:
      'Самий центр. Високі стелі, історичний будинок, акуратний ремонт.',
    images: ['placeholder-6.jpg'],
    ownerId: 'seed-owner-1',
  },
  {
    id: 'l7',
    title: 'Затишна квартира біля Стрийського парку',
    city: 'Lviv',
    address: 'вул. Стрийська, 20',
    description: 'Тиха локація, поруч парк, зручна розвʼязка. Є посудомийка.',
    images: ['placeholder-7.jpg'],
    ownerId: 'seed-owner-2',
  },
  {
    id: 'l8',
    title: '2-кімнатна поруч з Площею Ринок',
    city: 'Lviv',
    address: 'вул. Руська, 8',
    description:
      'Історичний центр, дві ізольовані кімнати, комфортно для двох-трьох людей.',
    images: ['placeholder-8.jpg'],
    ownerId: 'seed-owner-2',
  },
  {
    id: 'l9',
    title: 'Квартира з балконом біля Високого Замку',
    city: 'Lviv',
    address: 'вул. Замкова, 3',
    description:
      'Класний вид, свіже повітря, спокійний район. Підійде тим, хто любить гуляти.',
    images: ['placeholder-9.jpg'],
    ownerId: 'seed-owner-3',
  },
  {
    id: 'l10',
    title: 'Сучасна студія біля університету Франка',
    city: 'Lviv',
    address: 'вул. Університетська, 11',
    description:
      'Нова техніка, швидкий інтернет, багато світла. Заїжджай і живи.',
    images: ['placeholder-10.jpg'],
    ownerId: 'seed-owner-3',
  },
];
