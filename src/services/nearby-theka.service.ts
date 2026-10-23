
import { thekaService } from "./theka.service";
import { placesService } from "./places.service";
import { PlaceResponse } from "../types/places.types";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type CustomTheka = Coordinates & {
  id: number | string;
  name: string;
  [key: string]: unknown;
};

type GooglePlace = {
  id: string;
  name: string;
  address?: string;
  location: {
    lat: number;
    lng: number;
  };
  distance?: number;
  rating?: number;
  isOpen?: boolean;
  openingHours?: unknown;
  types?: string[];
  [key: string]: unknown;
};

const EARTH_RADIUS_METERS = 6_371_000;
const DUPLICATE_DISTANCE_METERS = 50;
const FUZZY_NAME_THRESHOLD = 0.9;

function normalizeName(name: string): string {
  return name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateDistanceMeters(
  first: Coordinates,
  second: Coordinates
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const lat1 = toRadians(first.latitude);
  const lat2 = toRadians(second.latitude);
  const deltaLat = toRadians(second.latitude - first.latitude);
  const deltaLng = toRadians(second.longitude - first.longitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.asin(Math.sqrt(Math.min(1, a)))
  );
}

// Dice similarity based on character bigrams.
// This handles small spelling/name variations without an external package.
function nameSimilarity(first: string, second: string): number {
  const a = normalizeName(first);
  const b = normalizeName(second);

  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const bigrams = (value: string): string[] => {
    const result: string[] = [];

    for (let i = 0; i < value.length - 1; i++) {
      result.push(value.slice(i, i + 2));
    }

    return result;
  };

  const firstBigrams = bigrams(a);
  const secondBigrams = bigrams(b);
  const remaining = [...secondBigrams];

  let matches = 0;

  for (const bigram of firstBigrams) {
    const index = remaining.indexOf(bigram);

    if (index !== -1) {
      matches++;
      remaining.splice(index, 1);
    }
  }

  return (2 * matches) / (firstBigrams.length + secondBigrams.length);
}

function isDuplicate(
  custom: CustomTheka,
  google: GooglePlace
): boolean {
  const distance = calculateDistanceMeters(
    {
      latitude: Number(custom.latitude),
      longitude: Number(custom.longitude),
    },
    {
      latitude: Number(google.location.lat),
      longitude: Number(google.location.lng),
    }
  );

  // Distance alone is not sufficient to identify the same store.
  if (distance > DUPLICATE_DISTANCE_METERS) {
    return false;
  }

  const customName = normalizeName(custom.name);
  const googleName = normalizeName(google.name);

  if (!customName || !googleName) {
    return false;
  }

  if (customName === googleName) {
    return true;
  }

  // Allow only very similar names when the locations are close.
  return nameSimilarity(customName, googleName) >= FUZZY_NAME_THRESHOLD;
}

class NearbyThekaService {
  async getCombinedNearbyThekas(
    lat: number,
    lng: number,
    radius: number,
    limit: number
  ) {
    const [customResult, googleResult] = await Promise.allSettled([
      thekaService.getNearbyThekas(lat, lng, radius, limit),
      placesService.searchNearbyLiquorStores(lat, lng, radius),
    ]);

    const customThekas: CustomTheka[] =
      customResult.status === "fulfilled"
        ? customResult.value
        : [];

    const googleResponse =
      googleResult.status === "fulfilled" ? googleResult.value : [];

    // Supports either an array or a { data: [...] } response.
    const googlePlaces: PlaceResponse[] =
  googleResult.status === "fulfilled"
    ? googleResult.value
    : [];

   const unmatchedGooglePlaces = googlePlaces.filter((place) => {
  return !customThekas.some((custom) =>
    isDuplicate(custom, {
      id: place.id,
      name: place.name,
      location: place.location,
    })
  );
});

    const custom = customThekas.map((theka) => ({
      ...theka,
      source: "custom" as const,
      isRegistered: true,
    }));

   const google = unmatchedGooglePlaces.map((place) => ({
  ...place,
  distanceMeters: place.distance,
  source: "google" as const,
  isRegistered: false,
}));

    const sourceErrors: string[] = [];

    if (customResult.status === "rejected") {
      sourceErrors.push("Registered thekas could not be loaded.");
    }

    if (googleResult.status === "rejected") {
      sourceErrors.push("Google Places results could not be loaded.");
    }

    return {
      searchLocation: { lat, lng },
      radius,
      totalResults: custom.length + google.length,
      custom,
      google,
      ...(sourceErrors.length > 0 ? { sourceErrors } : {}),
    };
  }
}

export const nearbyThekaService = new NearbyThekaService();
