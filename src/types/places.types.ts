export interface GooglePlace {
  id: string;

  types?: string[];

  formattedAddress?: string;

  location?: {
    latitude: number;
    longitude: number;
  };

  rating?: number;

  displayName?: {
    text: string;
    languageCode?: string;
  };

  currentOpeningHours?: {
    openNow?: boolean;
    periods?: Array<{
      open?: {
        day: number;
        hour: number;
        minute: number;
        date?: {
          year: number;
          month: number;
          day: number;
        };
      };
      close?: {
        day: number;
        hour: number;
        minute: number;
        date?: {
          year: number;
          month: number;
          day: number;
        };
      };
    }>;
    weekdayDescriptions?: string[];
    nextCloseTime?: string;
  };
}

export interface GooglePlacesResponse {
  places?: GooglePlace[];
}

export interface PlaceResponse {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  types: string[];
  distance?: number;
  rating?: number;
  isOpen?: boolean;
  openingHours?: string[];
}