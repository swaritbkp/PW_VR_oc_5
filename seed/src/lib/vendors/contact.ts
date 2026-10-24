import type { EventType } from '../plan/types';

const MOBILE = /^[6-9]\d{9}$/;
const LANDLINE = /^[1-5]\d{7,9}$/;
const INDIA_CODE = '91';

export interface Phone {
  readonly e164: string;
  readonly kind: 'mobile' | 'landline';
}

/** Normalises an Indian phone number to E.164. Returns null when it cannot be an Indian number. */
export function normalisePhoneIN(raw: string): Phone | null {
  const cleaned = raw.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+') && !cleaned.startsWith(`+${INDIA_CODE}`)) return null;
  let national = cleaned.replace(/\D/g, '');
  if (cleaned.startsWith('+') || (national.startsWith(INDIA_CODE) && national.length === 12)) {
    national = national.slice(INDIA_CODE.length);
  } else if (national.startsWith('0')) {
    national = national.slice(1);
  }
  if (MOBILE.test(national)) return { e164: `+${INDIA_CODE}${national}`, kind: 'mobile' };
  if (LANDLINE.test(national)) return { e164: `+${INDIA_CODE}${national}`, kind: 'landline' };
  return null;
}

/** tel: link for calling. */
export function telLink(phone: Phone): string {
  return `tel:${phone.e164}`;
}

/** WhatsApp click-to-chat link. Only mobile numbers can receive WhatsApp messages. */
export function whatsAppLink(phone: Phone, message: string): string | null {
  if (phone.kind !== 'mobile') return null;
  return `https://wa.me/${phone.e164.slice(1)}?text=${encodeURIComponent(message)}`;
}

/** Google Maps search URL (Maps URLs; needs no API key). */
export function mapsSearchUrl(query: string, placeId?: string): string {
  const base = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  return placeId ? `${base}&query_place_id=${encodeURIComponent(placeId)}` : base;
}

/** Google Maps directions URL to a destination (Maps URLs; needs no API key). */
export function mapsDirectionsUrl(destinationName: string, placeId?: string): string {
  const base = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationName)}`;
  return placeId ? `${base}&destination_place_id=${encodeURIComponent(placeId)}` : base;
}

export type EnquiryLanguage = 'en' | 'hi' | 'pa';

export interface EnquiryInput {
  readonly eventType: EventType;
  readonly date: string;
  readonly city: string;
  readonly guests: number;
  readonly language: EnquiryLanguage;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const EVENT_WORDS: Readonly<Record<EnquiryLanguage, Readonly<Record<EventType, string>>>> = {
  en: { wedding: 'wedding', birthday: 'birthday party', community: 'community event' },
  hi: { wedding: 'विवाह', birthday: 'जन्मदिन समारोह', community: 'सामुदायिक कार्यक्रम' },
  pa: { wedding: 'ਵਿਆਹ', birthday: 'ਜਨਮ ਦਿਨ ਸਮਾਗਮ', community: 'ਸਮਾਜਿਕ ਸਮਾਗਮ' },
};

/** Readable date such as 14 Dec 2026. Falls back to the input if it is not YYYY-MM-DD. */
export function humanDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1] ?? ''} ${match[1]}`;
}

/** Deterministic first message to a vendor. Contains no personal details beyond event facts. */
export function buildEnquiry(input: EnquiryInput): string {
  const when = humanDate(input.date);
  const what = EVENT_WORDS[input.language][input.eventType];
  if (input.language === 'hi') {
    return `नमस्ते, मैं ${when} को ${input.city} में लगभग ${input.guests} मेहमानों के लिए ${what} की योजना बना रहा/रही हूँ। क्या आप उस दिन उपलब्ध हैं? कृपया अपने पैकेज और उनमें क्या शामिल है, बता दें।`;
  }
  if (input.language === 'pa') {
    return `ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ ${when} ਨੂੰ ${input.city} ਵਿੱਚ ਲਗਭਗ ${input.guests} ਮਹਿਮਾਨਾਂ ਲਈ ${what} ਦੀ ਯੋਜਨਾ ਬਣਾ ਰਿਹਾ/ਰਹੀ ਹਾਂ। ਕੀ ਤੁਸੀਂ ਉਸ ਦਿਨ ਉਪਲਬਧ ਹੋ? ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਪੈਕੇਜ ਅਤੇ ਉਨ੍ਹਾਂ ਵਿੱਚ ਕੀ ਸ਼ਾਮਲ ਹੈ, ਦੱਸੋ।`;
  }
  return `Hello, I am planning a ${what} on ${when} in ${input.city} for about ${input.guests} guests. Are you available that day? Please share your packages, what is included, and any advance needed to confirm.`;
}
