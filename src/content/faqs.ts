/**
 * FAQ content (spec §32). Answers stay cautious and never make
 * lender-specific or advice-shaped claims.
 */

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export const FAQS: Faq[] = [
  {
    id: 'over-mileage',
    question: "How do I know if I'm over my PCP mileage?",
    answer:
      'Compare the miles you have driven since the agreement started with the share of your total allowance you would expect to have used by now. If you are a third of the way through the term, roughly a third of the allowance is the straight-line pace. Driving above that pace does not automatically mean a charge — what matters is the total mileage when the agreement ends.',
  },
  {
    id: 'excess-calculated',
    question: 'How is excess mileage calculated?',
    answer:
      'Excess mileage is normally the number of miles above your total contract allowance multiplied by the pence-per-mile rate stated in your agreement. Some agreements apply a higher rate above a stated threshold, and some quote the rate excluding VAT, so the payable amount can be higher than a simple multiplication suggests.',
  },
  {
    id: 'find-rate',
    question: 'Where can I find my excess mileage rate?',
    answer:
      'It is usually printed in your finance agreement, often near the mileage allowance or the end-of-agreement terms. If you cannot find it, your finance provider can confirm the rate and how VAT is treated. This calculator deliberately leaves the rate blank rather than assuming a typical figure.',
  },
  {
    id: 'what-happens',
    question: 'What happens if I go over my PCP mileage?',
    answer:
      'Going over the pace during the term is not itself a charge. Excess mileage is usually assessed against your total contract allowance at the end of the agreement, and typically applies when you return the vehicle. Your agreement sets out exactly when and how it is applied.',
  },
  {
    id: 'vat',
    question: 'Does VAT apply to excess mileage charges?',
    answer:
      'It depends on your agreement. Some lenders quote a pence-per-mile rate that already includes VAT, and others quote it excluding VAT so it is added on top. If you are not sure, this calculator shows the figure before any additional VAT rather than adding VAT you might not owe.',
  },
  {
    id: 'buy-instead',
    question: 'What happens if I buy the car instead of returning it?',
    answer:
      'Excess mileage charges are generally connected with returning a vehicle. Some providers state that the charge does not apply if you pay the final optional payment and keep the car. Because this varies, check the end-of-agreement section of your own contract before deciding.',
  },
  {
    id: 'part-exchange',
    question: 'Does excess mileage matter when part-exchanging?',
    answer:
      'Higher mileage generally reduces what a vehicle is worth, so it can affect a part-exchange valuation rather than arriving as a separate mileage invoice. Treating the projected excess charge as a comparison figure is a reasonable way to judge whether extra miles are worth it.',
  },
  {
    id: 'reduce-excess',
    question: 'Can I reduce my projected excess mileage before the contract ends?',
    answer:
      'Yes — because the allowance applies across the whole term, driving less later can offset driving more earlier. The planner on this page lets you test a lower monthly mileage and see the effect. Some providers also allow a mileage allowance to be adjusted mid-agreement; ask yours what is possible.',
  },
  {
    id: 'settlement-figure',
    question: 'Is this calculator an exact settlement figure?',
    answer:
      'No. It is a planning estimate built from the figures you enter. Your agreement controls the allowance, the rate, VAT treatment, any rate tiers and any other end-of-agreement charges. For a figure you can rely on, contact your finance provider.',
  },
];
