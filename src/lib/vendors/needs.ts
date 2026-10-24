import type { EventType, VendorNeedId } from '../plan/types';

interface NeedInfo {
  readonly label: string;
  readonly queries: {
    readonly default: readonly string[];
    readonly wedding?: readonly string[];
    readonly birthday?: readonly string[];
    readonly community?: readonly string[];
  };
}

/** Search vocabulary per need. Terms reflect how Indian businesses list themselves on maps. */
export const VENDOR_NEEDS: Readonly<Record<VendorNeedId, NeedInfo>> = {
  venue: {
    label: 'Venue',
    queries: {
      default: ['banquet hall'],
      wedding: ['wedding venue', 'marriage palace', 'banquet hall'],
      birthday: ['party hall', 'kids party venue'],
      community: ['community hall', 'open ground event venue'],
    },
  },
  caterer: {
    label: 'Caterer',
    queries: {
      default: ['caterers'],
      wedding: ['wedding caterers', 'halwai caterer'],
      birthday: ['party caterers'],
      community: ['bulk food caterers', 'halwai caterer'],
    },
  },
  decorator: {
    label: 'Decorator',
    queries: {
      default: ['event decorators'],
      wedding: ['wedding decorators'],
      birthday: ['birthday party decorators', 'balloon decorators'],
    },
  },
  photographer: {
    label: 'Photographer',
    queries: {
      default: ['event photographers'],
      wedding: ['wedding photographers'],
      birthday: ['birthday photographers'],
    },
  },
  music: {
    label: 'Music and DJ',
    queries: {
      default: ['DJ sound service'],
      wedding: ['dhol players', 'wedding DJ'],
      community: ['dhol players', 'DJ sound service'],
    },
  },
  makeup: {
    label: 'Makeup artist',
    queries: { default: ['makeup artist'], wedding: ['bridal makeup artist'] },
  },
  tent_house: {
    label: 'Tent and furniture rental',
    queries: { default: ['tent house', 'tent and furniture rental'] },
  },
  sound_lights: {
    label: 'Sound and lights',
    queries: { default: ['sound and light rental', 'event lighting rental'] },
  },
  invitations: {
    label: 'Invitation printing',
    queries: { default: ['printing press'], wedding: ['wedding card printers'] },
  },
  cake: {
    label: 'Cake',
    queries: {
      default: ['custom cake bakery'],
      birthday: ['birthday cake shop', 'custom cake bakery'],
    },
  },
  entertainer: {
    label: 'Entertainer',
    queries: {
      default: ['party entertainers'],
      birthday: ['kids party entertainer', 'magician for kids'],
    },
  },
  return_gifts: { label: 'Return gifts', queries: { default: ['return gifts shop', 'gift shop'] } },
  transport: {
    label: 'Transport',
    queries: { default: ['car rental with driver', 'tempo traveller hire'] },
  },
  stay: { label: 'Stay', queries: { default: ['hotels', 'guest house'] } },
  florist: { label: 'Florist', queries: { default: ['florist', 'flower decorators'] } },
  power_backup: { label: 'Generator rental', queries: { default: ['generator rental'] } },
};

const MAX_QUERIES = 2;

/** Text queries for a need in a city. At most two, event-type specific first. */
export function buildQueries(
  need: VendorNeedId,
  eventType: EventType,
  city: string,
  limit: number = MAX_QUERIES,
): string[] {
  const info = VENDOR_NEEDS[need];
  const terms = info.queries[eventType] ?? info.queries.default;
  const place = city.trim();
  const queries = terms.map((term) => (place ? `${term} in ${place}` : term));
  return [...new Set(queries)].slice(0, Math.max(1, limit));
}
