import axios from "axios";
import {
  GooglePlacesResponse,
  GooglePlace,
  PlaceResponse,
} from "../types/places.types";

export class PlacesService {
  private readonly googlePlacesUrl =
    "https://places.googleapis.com/v1/places:searchNearby";

  async searchNearbyLiquorStores(
    lat: number,
    lng: number,
    radius: number,
  ): Promise<PlaceResponse[]> {
    const apiKey = process.env.GOOGLE_DEMO_KEY;

    if (!apiKey) {
      throw new Error("GOOGLE_DEMO_KEY is not configured!");
    }

    try {
      const response = await axios.post<GooglePlacesResponse>(
        this.googlePlacesUrl,
        {
          includedTypes: ["liquor_store"],
          maxResultCount: 20,
          rankPreference: "DISTANCE",
          locationRestriction: {
            circle: {
              center: {
                latitude: lat,
                longitude: lng,
              },
              radius,
            },
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.location,places.formattedAddress,places.types,places.rating,places.currentOpeningHours",
          },
        },
      );

      const places = response.data.places || [];

      return places.map((place: GooglePlace): PlaceResponse => ({
  id: place.id,
  name: place.displayName?.text || "Unknown Liquor Store",
  address: place.formattedAddress || "Address not available",

  location: {
    lat: place.location?.latitude ?? 0,
    lng: place.location?.longitude ?? 0,
  },

  types: place.types || [],
  rating: place.rating,
  isOpen: place.currentOpeningHours?.openNow,
  openingHours:
    place.currentOpeningHours?.weekdayDescriptions || [],

  distance:
    place.location
      ? calculateDistance(
          lat,
          lng,
          place.location.latitude,
          place.location.longitude
        )
      : undefined,
}));
    } catch (error: any) {
      console.error(
        "Google Places API error:",
        error.response?.data || error.message,
      );

      throw error;
    }
  }


}

//   helper method to calculate distance
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371000;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export const placesService = new PlacesService();