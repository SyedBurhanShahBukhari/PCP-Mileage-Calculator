import { RadioCardGroup, type RadioCardOption } from '../ui/RadioCardGroup';
import type { EndAction } from '../../lib/types';

const OPTIONS: RadioCardOption<EndAction>[] = [
  {
    value: 'return',
    label: 'Return the car',
    description: 'Hand it back at the end of the agreement.',
    icon: 'arrow-right',
  },
  {
    value: 'buy',
    label: 'Buy / keep the car',
    description: 'Pay the final balloon payment and keep it.',
    icon: 'check',
  },
  {
    value: 'part_exchange',
    label: 'Part-exchange',
    description: 'Trade it in against your next vehicle.',
    icon: 'road',
  },
  {
    value: 'unsure',
    label: 'Not sure yet',
    description: "We'll show a neutral planning estimate.",
    icon: 'info',
  },
];

interface EndActionSelectorProps {
  value: EndAction;
  onChange: (value: EndAction) => void;
}

/** Group 5 — this choice materially changes the result wording (spec §4.6). */
export function EndActionSelector({ value, onChange }: EndActionSelectorProps) {
  return (
    <section className="form-group" aria-labelledby="group-end-action">
      <h3 className="form-group__title" id="group-end-action">
        At the end of your agreement
      </h3>
      <RadioCardGroup
        name="endAction"
        legend="What are you most likely to do at the end of your PCP?"
        hint="Excess mileage is usually charged when a vehicle is returned, so this changes how we explain your result."
        value={value}
        options={OPTIONS}
        onChange={onChange}
      />
    </section>
  );
}
