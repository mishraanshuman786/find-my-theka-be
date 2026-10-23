
import { searchHistoryRepository } from "../repositories/search-history.repository";
import { AppError } from "../utils/app-error";
import type {
  SaveLocationInput,
  RenameSavedLocationInput,
} from "../validators/search-history.validation";

export class SearchHistoryService {
  async saveLocation(userId: number, input: SaveLocationInput) {
    return searchHistoryRepository.createSavedLocation({
      userId,
      label: input.label,
      latitude: input.latitude,
      longitude: input.longitude,
    });
  }

  async getSavedLocations(userId: number) {
    return searchHistoryRepository.findSavedLocations(userId);
  }

  async renameSavedLocation(
    userId: number,
    id: string,
    input: RenameSavedLocationInput,
  ) {
    const location = await searchHistoryRepository.updateSavedLocation(
      Number(id),
      userId,
      input.label,
    );

    if (!location) {
      throw new AppError("Saved location not found!", 404);
    }

    return location;
  }

  async deleteSavedLocation(userId: number, id: string) {
    const deleted = await searchHistoryRepository.deleteSavedLocation(
      Number(id),
      userId,
    );

    if (!deleted) {
      throw new AppError("Saved location not found!", 404);
    }

    return deleted;
  }
}

export const searchHistoryService = new SearchHistoryService();
