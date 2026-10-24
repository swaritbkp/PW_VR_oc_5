import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { TEMPLATES, buildTemplateTasks, type EventTemplate } from '../src/lib/templates/catalog';
import { EVENT_DAY_ID } from '../src/lib/templates/skeletons';
import type { PlanTask } from '../src/lib/plan/types';
import type { IntakeInput } from '../src/lib/plan/schemas';
import type { PlannerCoreOutput, PlannerExtrasOutput } from '../src/server/genai/schemas';

const FIXTURES_DIR = resolve(process.cwd(), 'evals', 'fixtures');

export interface FixtureData {
  scenarioId: string;
  templateId: string;
  intake: IntakeInput;
  core: PlannerCoreOutput;
  extras: PlannerExtrasOutput;
}

function makeBudgetLines(template: EventTemplate, guests: number, budget: number) {
  // Lines sum to ~88% of total budget so that +10% contingency leaves ~3% headroom (fits within budget)
  const perHeadRate = Math.round((budget * 0.35) / guests);
  return [
    {
      id: 'B01',
      category: 'venue' as const,
      name: 'Venue rental charge',
      unit: 'fixed' as const,
      rateInr: Math.round(budget * 0.25),
      drivers: ['budget' as const],
      notes: 'Estimate for venue',
    },
    {
      id: 'B02',
      category: 'food' as const,
      name: 'Catering feast per head',
      unit: 'per_head' as const,
      rateInr: perHeadRate,
      drivers: ['guests' as const],
      notes: 'Estimate per head for guests',
    },
    {
      id: 'B03',
      category: 'decor' as const,
      name: 'Thematic decor and styling',
      unit: 'fixed' as const,
      rateInr: Math.round(budget * 0.13),
      drivers: ['budget' as const],
      notes: 'Estimate for decor',
    },
    {
      id: 'B04',
      category: 'media' as const,
      name: 'Photography and video coverage',
      unit: 'fixed' as const,
      rateInr: Math.round(budget * 0.08),
      drivers: ['budget' as const],
      notes: 'Estimate for photography',
    },
    {
      id: 'B05',
      category: 'entertainment' as const,
      name: 'Live music and sound setup',
      unit: 'fixed' as const,
      rateInr: Math.round(budget * 0.07),
      drivers: ['budget' as const],
      notes: 'Estimate for entertainment',
    },
  ];
}

function makeExtras(template: EventTemplate): PlannerExtrasOutput {
  return {
    ideas: [
      `Incorporate traditional ${template.style[0]} touches`,
      'Provide local artisan welcome hampers',
    ],
    vendorQuestions: [
      { need: 'venue', questions: ['What are the setup timing windows and noise cut-off rules?'] },
    ],
    assumptions: [
      'Weather permits scheduled outdoor activities',
      'Guest count remains within 10% tolerance',
    ],
    risks: [
      'High-season vendor availability crunch in chosen city',
      'Power fluctuations requiring backup generators',
    ],
  };
}

function toCoreTasks(tasks: readonly PlanTask[]): PlannerCoreOutput['tasks'] {
  return tasks.map((t) => ({
    ...t,
    dependsOn: [...t.dependsOn],
    drivers: [...t.drivers],
  }));
}

function buildTemplateFixture(t: EventTemplate): FixtureData {
  const guests = t.guests.typical;
  const budgetInr = t.budgetInr.typical;
  const intake: IntakeInput = {
    eventType: t.eventType,
    templateId: t.id,
    city: 'Chandigarh',
    date: '2027-11-20',
    guests,
    budgetInr,
    style: t.style.join(', '),
    nonNegotiables: ['Authentic cultural elements'],
    language: 'en',
  };
  const tasks = buildTemplateTasks(t);
  return {
    scenarioId: t.id,
    templateId: t.id,
    intake,
    core: { tasks: toCoreTasks(tasks), budgetLines: makeBudgetLines(t, guests, budgetInr) },
    extras: makeExtras(t),
  };
}

function buildHindiFixture(): FixtureData {
  const t = TEMPLATES[0];
  const guests = 250;
  const budgetInr = 2_000_000;
  const baseTasks = buildTemplateTasks(t);
  const hiTasks = baseTasks.map((task) => {
    if (task.id === EVENT_DAY_ID.wedding) {
      return {
        ...task,
        name: 'विवाह समारोह मुख्य दिवस',
        why: 'विवाह का मुख्य उत्सव और सभी रस्में',
      };
    }
    return { ...task, name: `${task.name} (व्यवस्था)`, why: 'उत्सव की तैयारी के लिए आवश्यक कदम' };
  });
  return {
    scenarioId: 'golden-13-hindi-wedding',
    templateId: t.id,
    intake: {
      eventType: 'wedding',
      templateId: t.id,
      city: 'Delhi',
      date: '2027-12-10',
      guests,
      budgetInr,
      style: 'पारंपरिक विवाह',
      nonNegotiables: ['शुद्ध शाकाहारी भोजन'],
      language: 'hi',
    },
    core: {
      tasks: toCoreTasks(hiTasks),
      budgetLines: [
        {
          id: 'HB1',
          category: 'venue',
          name: 'विवाह स्थल किराया',
          unit: 'fixed',
          rateInr: 500_000,
          drivers: ['budget'],
          notes: 'स्थल का अनुमानित किराया',
        },
        {
          id: 'HB2',
          category: 'food',
          name: 'पारंपरिक दावत प्रति व्यक्ति',
          unit: 'per_head',
          rateInr: 2500,
          drivers: ['guests'],
          notes: '250 अतिथियों के लिए भोजन व्यवस्था',
        },
        {
          id: 'HB3',
          category: 'decor',
          name: 'गेंदा और पुष्प सज्जा',
          unit: 'fixed',
          rateInr: 300_000,
          drivers: ['budget'],
          notes: 'मंडप और द्वार सज्जा',
        },
        {
          id: 'HB4',
          category: 'media',
          name: 'छायांकन एवं वीडियोग्राफी',
          unit: 'fixed',
          rateInr: 180_000,
          drivers: ['budget'],
          notes: 'दो दिवसीय कवरेज',
        },
        {
          id: 'HB5',
          category: 'entertainment',
          name: 'शहनाई और ढोल वादन',
          unit: 'fixed',
          rateInr: 90_000,
          drivers: ['budget'],
          notes: 'बारात और स्वागत संगीत',
        },
      ],
    },
    extras: {
      ideas: ['स्वागत में मिट्टी के कुल्हड़ों में पेय', 'हस्तनिर्मित जयमाला'],
      vendorQuestions: [
        { need: 'venue', questions: ['क्या रात 10 बजे के बाद संगीत की अनुमति है?'] },
      ],
      assumptions: ['अतिथियों की संख्या 250 रहेगी'],
      risks: ['दिसंबर की ठंड और कोहरा'],
    },
  };
}

function buildPunjabiFixture(): FixtureData {
  const t = TEMPLATES.find((x) => x.id === 'community-gurpurab-langar') || TEMPLATES[10];
  const guests = 500;
  const budgetInr = 150_000;
  const baseTasks = buildTemplateTasks(t);
  const paTasks = baseTasks.map((task) => {
    if (task.id === EVENT_DAY_ID.community) {
      return { ...task, name: 'ਗੁਰਪੁਰਬ ਲੰਗਰ ਸਮਾਗਮ ਦਿਵਸ', why: 'ਸੰਗਤ ਲਈ ਮੁੱਖ ਲੰਗਰ ਅਤੇ ਕੀਰਤਨ ਦਿਵਸ' };
    }
    return { ...task, name: `${task.name} (ਪ੍ਰਬੰਧ)`, why: 'ਗੁਰਪੁਰਬ ਸਮਾਗਮ ਦੀ ਤਿਆਰੀ' };
  });
  return {
    scenarioId: 'golden-13-punjabi-langar',
    templateId: t.id,
    intake: {
      eventType: 'community',
      templateId: t.id,
      city: 'Amritsar',
      date: '2027-11-28',
      guests,
      budgetInr,
      style: 'ਗੁਰਮਤਿ ਰਹਿਤ ਮਰਯਾਦਾ',
      nonNegotiables: ['ਨਿਰਸਵਾਰਥ ਸੇਵਾ'],
      language: 'pa',
    },
    core: {
      tasks: toCoreTasks(paTasks),
      budgetLines: [
        {
          id: 'PB1',
          category: 'food',
          name: 'ਗੁਰੂ ਕਾ ਲੰਗਰ ਰਸਦ ਸਮੱਗਰੀ',
          unit: 'per_head',
          rateInr: 150,
          drivers: ['guests'],
          notes: '500 ਸੰਗਤਾਂ ਲਈ ਲੰਗਰ ਰਸਦ',
        },
        {
          id: 'PB2',
          category: 'venue',
          name: 'ਟੈਂਟ ਅਤੇ ਬੈਠਣ ਦੀ ਵਿਵਸਥਾ',
          unit: 'fixed',
          rateInr: 25_000,
          drivers: ['budget'],
          notes: 'ਪੰਡਾਲ ਅਤੇ ਦਰੀਆਂ ਦਾ ਪ੍ਰਬੰਧ',
        },
        {
          id: 'PB3',
          category: 'entertainment',
          name: 'ਸਾਊਂਡ ਅਤੇ ਕੀਰਤਨ ਸਿਸਟਮ',
          unit: 'fixed',
          rateInr: 12_000,
          drivers: ['budget'],
          notes: 'ਕੀਰਤਨ ਦਰਬਾਰ ਆਡੀਓ',
        },
        {
          id: 'PB4',
          category: 'logistics',
          name: 'ਪਾਣੀ ਅਤੇ ਸਫਾਈ ਪ੍ਰਬੰਧ',
          unit: 'fixed',
          rateInr: 8_000,
          drivers: ['budget'],
          notes: 'ਸੇਵਾਦਾਰ ਸਫਾਈ ਸਾਮਾਨ',
        },
        {
          id: 'PB5',
          category: 'decor',
          name: 'ਫੁੱਲਾਂ ਦੀ ਸੇਵਾ ਅਤੇ ਰੋਸ਼ਨੀ',
          unit: 'fixed',
          rateInr: 5_000,
          drivers: ['budget'],
          notes: 'ਦਰਬਾਰ ਸਾਹਿਬ ਫੁੱਲ',
        },
      ],
    },
    extras: {
      ideas: ['ਜੋੜਾ ਘਰ ਵਿਸ਼ੇਸ਼ ਸੇਵਾ', 'ਬਾਲ ਸੰਗਤ ਲਈ ਕੁਇਜ਼'],
      vendorQuestions: [{ need: 'tent_house', questions: ['ਵਾਟਰਪਰੂਫ ਪੰਡਾਲ ਉਪਲਬਧ ਹੈ?'] }],
      assumptions: ['ਸੇਵਾਦਾਰ ਸਮੇਂ ਸਿਰ ਪਹੁੰਚਣਗੇ'],
      risks: ['ਮੀਂਹ ਪੈਣ ਦੀ ਸੰਭਾਵਨਾ'],
    },
  };
}

function buildCrunchFixture(): FixtureData {
  const t = TEMPLATES.find((x) => x.id === 'birthday-dino-explorer') || TEMPLATES[4];
  const guests = 40;
  const budgetInr = 40_000;
  const today = new Date();
  // 5 days out: available (5 days) < critical path duration (11.6 days) -> buffer = -6.6 days (crunch mode)
  const targetDate = new Date(today.getTime() + 5 * 86_400_000).toISOString().slice(0, 10);
  return {
    scenarioId: 'golden-02-crunch-birthday',
    templateId: t.id,
    intake: {
      eventType: 'birthday',
      templateId: t.id,
      city: 'Ludhiana',
      date: targetDate,
      guests,
      budgetInr,
      style: 'Dino adventure',
      nonNegotiables: ['T-Rex cake'],
      language: 'en',
    },
    core: {
      tasks: toCoreTasks(buildTemplateTasks(t)),
      budgetLines: makeBudgetLines(t, guests, budgetInr),
    },
    extras: makeExtras(t),
  };
}

/** Generates and records all required fixtures into evals/fixtures. */
export function recordAllFixtures(): void {
  if (!existsSync(FIXTURES_DIR)) {
    mkdirSync(FIXTURES_DIR, { recursive: true });
  }
  const fixtures: FixtureData[] = [
    ...TEMPLATES.map(buildTemplateFixture),
    buildHindiFixture(),
    buildPunjabiFixture(),
    buildCrunchFixture(),
  ];
  for (const f of fixtures) {
    const filePath = resolve(FIXTURES_DIR, `${f.scenarioId}.json`);
    writeFileSync(filePath, JSON.stringify(f, null, 2), 'utf-8');
  }
  console.log(`[EVALS] Successfully recorded ${fixtures.length} fixtures in evals/fixtures/`);
}

if (process.argv.includes('--run-direct')) {
  recordAllFixtures();
}
