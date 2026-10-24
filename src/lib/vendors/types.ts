import type { VendorNeedId } from '../plan/types';

export interface LatLng {
  readonly lat: number;
  readonly lng: number;
}

/** A place returned by search. Treat as transient content: persist only the placeId and user-entered fields. */
export interface Vendor {
  readonly placeId: string;
  readonly name: string;
  readonly address: string;
  readonly location: LatLng;
  readonly rating?: number;
  readonly ratingCount?: number;
  readonly priceLevel?: 0 | 1 | 2 | 3 | 4;
  readonly mapsUrl?: string;
  readonly phone?: string;
  readonly website?: string;
  readonly distanceKm?: number;
}

export type VendorStatus =
  'shortlisted' | 'contacted' | 'quoted' | 'booked' | 'backup' | 'rejected';

/** What the app stores about a vendor: the id and the user's own decisions, nothing else. */
export interface VendorSelection {
  readonly placeId: string;
  readonly need: VendorNeedId;
  readonly status: VendorStatus;
  readonly quoteInr?: number;
  readonly note?: string;
}
