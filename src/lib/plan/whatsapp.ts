import { formatInr } from '../format';
import type { PlanState } from './propagate';

export type SupportedLanguage = 'en' | 'hi' | 'pa';

const EVENT_TITLES: Record<SupportedLanguage, Record<string, string>> = {
  en: { wedding: 'Wedding Celebration', birthday: 'Birthday Party', community: 'Community Event' },
  hi: { wedding: 'विवाह समारोह', birthday: 'जन्मदिन उत्सव', community: 'सामुदायिक कार्यक्रम' },
  pa: { wedding: 'ਵਿਆਹ ਸਮਾਗਮ', birthday: 'ਜਨਮਦਿਨ ਜਸ਼ਨ', community: 'ਭਾਈਚਾਰਕ ਸਮਾਗਮ' },
};

const LABELS: Record<
  SupportedLanguage,
  { city: string; date: string; guests: string; budget: string; tasks: string; link: string }
> = {
  en: {
    city: 'City',
    date: 'Date',
    guests: 'Guests',
    budget: 'Target Budget',
    tasks: 'Tasks',
    link: 'View Event Graph',
  },
  hi: {
    city: 'शहर',
    date: 'दिनांक',
    guests: 'अतिथि',
    budget: 'बजट',
    tasks: 'कार्य',
    link: 'इवेंट ग्राफ़ देखें',
  },
  pa: {
    city: 'ਸ਼ਹਿਰ',
    date: 'ਮਿਤੀ',
    guests: 'ਮਹਿਮਾਨ',
    budget: 'ਬਜਟ',
    tasks: 'ਕੰਮ',
    link: 'ਈਵੈਂਟ ਗ੍ਰਾਫ਼ ਵੇਖੋ',
  },
};

/**
 * Builds a formatted WhatsApp message summarizing the event plan in English, Hindi, or Punjabi.
 */
export function buildWhatsAppSummary(plan: PlanState, lang: SupportedLanguage = 'en'): string {
  const titles = EVENT_TITLES[lang] ?? EVENT_TITLES.en;
  const labels = LABELS[lang] ?? LABELS.en;
  const eventTitle = titles[plan.intake.eventType] ?? 'Celebration';
  const doneCount = plan.tasks.filter((t) => t.done).length;
  const totalTasks = plan.tasks.length;
  const budgetStr = formatInr(plan.intake.budgetInr);

  const lines = [
    `*Jashn: ${eventTitle}*`,
    `📍 ${labels.city}: ${plan.intake.city}`,
    `📅 ${labels.date}: ${plan.intake.date}`,
    `👥 ${labels.guests}: ${plan.intake.guests}`,
    `💰 ${labels.budget}: ${budgetStr}`,
    `✅ ${labels.tasks}: ${doneCount}/${totalTasks} complete`,
  ];

  if (plan.intake.nonNegotiables.length > 0) {
    const nnLabel =
      lang === 'hi' ? 'महत्वपूर्ण बातें' : lang === 'pa' ? 'ਜ਼ਰੂਰੀ ਗੱਲਾਂ' : 'Key Priorities';
    lines.push(`⭐ ${nnLabel}: ${plan.intake.nonNegotiables.join(', ')}`);
  }

  return lines.join('\n');
}
