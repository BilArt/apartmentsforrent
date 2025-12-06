const listings = [
  {
    id: 'l1',
    title: '1-кімнатна квартира біля метро Лукʼянівська',
    city: 'Київ',
    address: 'вул. Глибочицька, 32А',
    description:
      'Світла студія з панорамними вікнами, 8 хвилин пішки до метро Лукʼянівська. Нова техніка, індивідуальне опалення.',
    landlordId: 'landlord-1',
    landlordName: 'Ольга К.',
    landlordRating: 4.8,
  },
  {
    id: 'l2',
    title: '2-кімнатна біля Осокорків з видом на озеро',
    city: 'Київ',
    address: 'просп. Миколи Бажана, 16',
    description:
      'Окрема спальня та кухня-студія, балкон з видом на озеро. Закрита територія, підземний паркінг.',
    landlordId: 'landlord-2',
    landlordName: 'Ігор С.',
    landlordRating: 4.6,
  },
  {
    id: 'l3',
    title: 'Гарсонʼєра в центрі поруч з Золотими воротами',
    city: 'Київ',
    address: 'вул. Ярославів Вал, 13',
    description:
      'Компактна квартира для однієї людини. Історичний центр, високі стелі, цегляний будинок.',
    landlordId: 'landlord-3',
    landlordName: 'Марія Л.',
    landlordRating: 4.9,
  },
  {
    id: 'l4',
    title: 'Сучасна 2-кімнатна на Позняках',
    city: 'Київ',
    address: 'вул. Драгоманова, 2Б',
    description:
      'Кухня-студія, окрема спальня, кондиціонер у кожній кімнаті. Поруч ТРЦ, супермаркет, парк.',
    landlordId: 'landlord-2',
    landlordName: 'Ігор С.',
    landlordRating: 4.6,
  },
  {
    id: 'l5',
    title: '3-кімнатна для сімʼї біля Нивок',
    city: 'Київ',
    address: 'просп. Перемоги, 89',
    description:
      'Три окремі кімнати, роздільний санвузол, багато місця для зберігання. Поруч школа та садок.',
    landlordId: 'landlord-4',
    landlordName: 'Олександр П.',
    landlordRating: 4.7,
  },

  // ЛЬВІВ
  {
    id: 'l6',
    title: '1-кімнатна в австрійському будинку біля Оперного',
    city: 'Львів',
    address: 'просп. Свободи, 35',
    description:
      'Класичний львівський стиль: висока стеля, паркет, великі вікна. 3 хвилини до Оперного театру.',
    landlordId: 'landlord-5',
    landlordName: 'Наталія Р.',
    landlordRating: 4.9,
  },
  {
    id: 'l7',
    title: '2-кімнатна на Сихові з новим ремонтом',
    city: 'Львів',
    address: 'просп. Червоної Калини, 85',
    description:
      'Світла квартира в новобудові. Тепла підлога на кухні, гардеробна, нові меблі.',
    landlordId: 'landlord-6',
    landlordName: 'Андрій Б.',
    landlordRating: 4.5,
  },
  {
    id: 'l8',
    title: 'Лофт-студія біля вокзалу',
    city: 'Львів',
    address: 'вул. Чернівецька, 21',
    description:
      'Лофт з відкритою стелею, великим робочим столом і зоною відпочинку. Зручно для IT-спеціаліста.',
    landlordId: 'landlord-5',
    landlordName: 'Наталія Р.',
    landlordRating: 4.9,
  },
  {
    id: 'l9',
    title: '3-кімнатна біля Стрийського парку',
    city: 'Львів',
    address: 'вул. Самчука, 14',
    description:
      'Спокійний зелений район, вікна у двір, окрема кухня. Ідеально для сімʼї з дітьми.',
    landlordId: 'landlord-7',
    landlordName: 'Роман Д.',
    landlordRating: 4.8,
  },
  {
    id: 'l10',
    title: 'Студія в новобудові з терасою',
    city: 'Львів',
    address: 'вул. Наукова, 7Д',
    description:
      'Сучасна студія з великою терасою. Є місце під гриль і зону чіл-аут.',
    landlordId: 'landlord-6',
    landlordName: 'Андрій Б.',
    landlordRating: 4.5,
  },
];

export function getAllListings() {
  return listings;
}

export function getListingsByLandlordId(landlordId) {
  return listings.filter(listing => listing.landlordId === landlordId);
}

export function addListing(data) {
  const newListing = {
    id: `l${Date.now()}`,
    ...data,
  };

  listings.push(newListing);
  return newListing;
}
