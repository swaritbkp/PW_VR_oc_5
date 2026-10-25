import { z } from 'zod';
import { stripControlChars } from '../format';

export const VendorNeedEnum = z.enum([
  'venue',
  'caterer',
  'decorator',
  'photographer',
  'music',
  'makeup',
  'tent_house',
  'sound_lights',
  'invitations',
  'cake',
  'entertainer',
  'return_gifts',
  'transport',
  'stay',
  'florist',
  'power_backup',
]);

export const EventTypeEnum = z.enum(['wedding', 'birthday', 'community']);

export const LatLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const VendorSearchRequestSchema = z.object({
  need: VendorNeedEnum,
  eventType: EventTypeEnum,
  city: z.string().transform(stripControlChars).pipe(z.string().min(1).max(60)),
  center: LatLngSchema.optional(),
  radiusMeters: z.number().positive().max(50_000).optional(),
  maxPriceLevel: z.number().int().min(0).max(4).optional(),
});

export type VendorSearchRequest = z.infer<typeof VendorSearchRequestSchema>;

export const VendorDetailsRequestSchema = z.object({
  placeId: z.string().transform(stripControlChars).pipe(z.string().min(1).max(200)),
});

export type VendorDetailsRequest = z.infer<typeof VendorDetailsRequestSchema>;
