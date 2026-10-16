export const WHATSAPP_NUMBER = '213733212334';
export const WHATSAPP_DISPLAY = '+213 733 21 23 34';

export const WLIDI_PLANS = [
  {
    plan: 'MONTH_1' as const,
    label: 'Monthly',
    amountDa: 450,
    months: 1,
    maxKids: 2,
    lifetime: false,
    badge: null as string | null,
    blurb: 'All features · up to 2 kids',
  },
  {
    plan: 'YEAR_1' as const,
    label: 'Yearly',
    amountDa: 4900,
    months: 12,
    maxKids: 5,
    lifetime: false,
    badge: 'BEST VALUE',
    blurb: 'All features · up to 5 kids',
  },
  {
    plan: 'LIFETIME' as const,
    label: 'Founder lifetime',
    amountDa: 5900,
    months: 0,
    maxKids: 5,
    lifetime: true,
    badge: 'FOUNDER',
    blurb: 'Pay once · all features forever · up to 5 kids',
  },
];

export function formatDa(amount: number) {
  return `${amount.toLocaleString('fr-DZ')} DA`;
}

export function whatsappCheckoutUrl(input: {
  name: string;
  accountId: string;
  planLabel: string;
  amountDa: number;
}) {
  const message = [
    'Salam, I want to subscribe to WLIDI.',
    '',
    `Name: ${input.name}`,
    `Account ID: ${input.accountId}`,
    `Plan: ${input.planLabel} (${formatDa(input.amountDa)})`,
    '',
    'Please confirm how I can pay.',
  ].join('\n');
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
