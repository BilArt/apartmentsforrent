import { Injectable } from '@nestjs/common';
import { favorites } from './favorites.store';

@Injectable()
export class FavoritesService {
  getUserFavorites(userId: string) {
    return favorites.filter((f) => f.userId === userId).map((f) => f.listingId);
  }

  toggle(userId: string, listingId: string) {
    const idx = favorites.findIndex(
      (f) => f.userId === userId && f.listingId === listingId,
    );

    if (idx !== -1) {
      favorites.splice(idx, 1);
      return false;
    }

    favorites.push({ userId, listingId });
    return true;
  }
}
