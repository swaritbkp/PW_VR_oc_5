export type NegotiationTactic = 'off_peak' | 'milestone_stagger' | 'value_add' | 'volume_guarantee';

export type NegotiationLanguage = 'en' | 'hi' | 'pa';

export interface NegotiationContext {
  readonly vendorName: string;
  readonly category: string;
  readonly city: string;
  readonly originalQuoteInr: number;
  readonly guestCount: number;
  readonly eventDate: string;
  readonly tactic: NegotiationTactic;
  readonly language: NegotiationLanguage;
}

export interface NegotiationStrategy {
  readonly tactic: NegotiationTactic;
  readonly language: NegotiationLanguage;
  readonly targetDiscountPct: number;
  readonly estimatedSavingsInr: number;
  readonly targetOfferInr: number;
  readonly strategicLeverage: string;
  readonly pitchScript: string;
  readonly talkingPoints: readonly string[];
  readonly counterClauseRecommendation: string;
}

function getTacticDiscount(tactic: NegotiationTactic): number {
  switch (tactic) {
    case 'off_peak':
      return 18;
    case 'volume_guarantee':
      return 12;
    case 'milestone_stagger':
      return 8;
    case 'value_add':
      return 5;
  }
}

function buildEnglishPitch(ctx: NegotiationContext, targetOffer: number): string {
  if (ctx.tactic === 'value_add') {
    return (
      `Dear ${ctx.vendorName} team, we truly appreciate your quote for our ${ctx.category} in ` +
      `${ctx.city}. To finalize without further rounds, could you include complimentary welcome ` +
      `beverage service or extended coverage within this budget? We are ready to sign today.`
    );
  }
  return (
    `Dear ${ctx.vendorName} team, we have reviewed your initial proposal for our ${ctx.city} ` +
    `celebration. Given our confirmed ${ctx.guestCount} guest scale and structured timeline, ` +
    `we can confirm the booking immediately at a consolidated budget of ₹${targetOffer.toLocaleString('en-IN')}. ` +
    `Looking forward to partnering with your esteemed team.`
  );
}

function buildHindiPitch(ctx: NegotiationContext, targetOffer: number): string {
  return (
    `नमस्ते ${ctx.vendorName} जी, हमारे परिवार को आपका काम बहुत पसंद आया है। ` +
    `${ctx.city} में हमारी इस तारीख के लिए हम ₹${targetOffer.toLocaleString('en-IN')} के बजट में ` +
    `तुरंत पक्का करना चाहते हैं। साथ ही 25% बुकिंग और बाकी माइलस्टोन पेमेंट पर सहमति रहेगी। ` +
    `कृपया बताएं कब मिलकर फाइनल कर सकते हैं।`
  );
}

function buildPunjabiPitch(ctx: NegotiationContext, targetOffer: number): string {
  return (
    `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ${ctx.vendorName} ਜੀ, ਤੁਹਾਡਾ ਕੰਮ ਸਾਨੂੰ ਬਹੁਤ ਪਸੰਦ ਆਇਆ ਹੈ। ` +
    `${ctx.city} ਵਿੱਚ ਸਾਡੇ ${ctx.guestCount} ਮਹਿਮਾਨਾਂ ਦੇ ਇਕੱਠ ਲਈ ਅਸੀਂ ₹${targetOffer.toLocaleString('en-IN')} ` +
    `ਵਿੱਚ ਤੁਰੰਤ ਬੁਕਿੰਗ ਫਾਈਨਲ ਕਰਨ ਲਈ ਤਿਆਰ ਹਾਂ। ਦੱਸੋ ਕਦੋਂ ਸ਼ਗਨ ਦਾ ਟੋਕਨ ਦੇ ਸਕਦੇ ਹਾਂ।`
  );
}

function buildPitchScript(
  ctx: NegotiationContext,
  lang: NegotiationLanguage,
  targetOffer: number,
): string {
  if (lang === 'hi') return buildHindiPitch(ctx, targetOffer);
  if (lang === 'pa') return buildPunjabiPitch(ctx, targetOffer);
  return buildEnglishPitch(ctx, targetOffer);
}

function buildTalkingPoints(tactic: NegotiationTactic): readonly string[] {
  switch (tactic) {
    case 'off_peak':
      return [
        'Highlight weekday / off-peak seasonality leverage.',
        'Emphasize prompt payment with zero billing delays.',
        'Offer positive social referrals within local community.',
      ];
    case 'volume_guarantee':
      return [
        'Guarantee non-fluctuating minimum guest headcount.',
        'Consolidate multiple requirements with single vendor.',
        'Commit to early setup clearances.',
      ];
    case 'milestone_stagger':
      return [
        'Propose 25% token, 50% on-site setup, 25% post-completion signoff.',
        'Eliminate risk of unfulfilled deliverables.',
        'Provide transparent bank transfer guarantee.',
      ];
    case 'value_add':
      return [
        'Request complimentary inclusions (welcome drinks, bridal lounge decor).',
        'Ask for extended 1-hour overtime waiver without surcharge.',
        'Seek complimentary secondary rehearsal setup.',
      ];
  }
}

function buildCounterClause(tactic: NegotiationTactic, lang: NegotiationLanguage): string {
  if (lang === 'hi') {
    return 'माइलस्टोन पेमेंट क्लॉज: 25% टोकन एडवांस, 50% सेटअप के समय, और 25% इवेंट पूरा होने पर संतोषजनक रिव्यू के बाद।';
  }
  if (lang === 'pa') {
    return 'ਮਾਈਲਸਟੋਨ ਪੇਮੈਂਟ ਸ਼ਰਤ: 25% ਬੁਕਿੰਗ ਟੋਕਨ, 50% ਤਿਆਰੀ ਵੇਲੇ, 25% ਸਮਾਗਮ ਦੀ ਪੂਰੀ ਸਮਾਪਤੀ ਤੋਂ ਬਾਅਦ।';
  }
  return 'Milestone Clause: 25% booking token, 50% on verified setup commencement, 25% following event completion and inspection sign-off.';
}

/**
 * Formulates an authentic, culturally nuanced negotiation pitch and counter-offer
 * tailored to Indian celebration vendors across English, Hindi, and Punjabi.
 */
export function formulateNegotiation(context: NegotiationContext): NegotiationStrategy {
  const safeQuote = Math.max(1000, Math.min(100000000, Number.isFinite(context.originalQuoteInr) ? context.originalQuoteInr : 1000));
  const discountPct = getTacticDiscount(context.tactic);
  const savings = Math.round(safeQuote * (discountPct / 100));
  const targetOffer = Math.max(0, safeQuote - savings);

  return {
    tactic: context.tactic,
    language: context.language,
    targetDiscountPct: discountPct,
    estimatedSavingsInr: savings,
    targetOfferInr: targetOffer,
    strategicLeverage: `Tactic leverages ${context.tactic.replace('_', ' ')} dynamics to secure optimal rates.`,
    pitchScript: buildPitchScript(context, context.language, targetOffer),
    talkingPoints: buildTalkingPoints(context.tactic),
    counterClauseRecommendation: buildCounterClause(context.tactic, context.language),
  };
}
