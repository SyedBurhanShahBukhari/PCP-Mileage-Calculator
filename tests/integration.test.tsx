import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../src/App';
import { CalculatorSection } from '../src/components/calculator/CalculatorSection';

/** Fixed as-of date so nothing depends on the machine clock (FR-029). */
const AS_OF = '2026-09-07';

interface FillOptions {
  allowanceMode?: 'annual' | 'total';
  allowance: string;
  contractLength: string;
  startOdometer?: string;
  currentOdometer: string;
  elapsedMonths?: string;
  startDate?: string;
  rate?: string;
}

const user = () => userEvent.setup();

function renderCalculator() {
  return render(<CalculatorSection asOfDate={AS_OF} persist={false} />);
}

async function typeInto(label: RegExp | string, value: string) {
  const field = screen.getByLabelText(label);
  await user().clear(field);
  if (value !== '') await user().type(field, value);
}

async function fillForm(options: FillOptions) {
  const mode = options.allowanceMode ?? 'total';
  if (mode === 'total') {
    await user().click(screen.getByRole('radio', { name: /total contract allowance/i }));
    await typeInto(/total contract mileage allowance/i, options.allowance);
  } else {
    await typeInto(/annual mileage allowance/i, options.allowance);
  }
  await typeInto(/contract length/i, options.contractLength);
  await typeInto(/odometer when the agreement started/i, options.startOdometer ?? '0');
  if (options.startDate) {
    await typeInto(/agreement start date/i, options.startDate);
  } else if (options.elapsedMonths !== undefined) {
    await typeInto(/months elapsed/i, options.elapsedMonths);
  }
  await typeInto(/current odometer reading/i, options.currentOdometer);
  if (options.rate !== undefined) {
    await typeInto(/excess mileage rate/i, options.rate);
  }
}

const calculate = () => user().click(screen.getByRole('button', { name: /calculate my mileage/i }));

afterEach(cleanup);
beforeEach(() => window.localStorage.clear());

describe('IT-001 reference regression through the UI', () => {
  it('renders every headline figure from the specification', async () => {
    renderCalculator();
    await fillForm({
      allowance: '30000',
      contractLength: '36',
      currentOdometer: '18450',
      elapsedMonths: '14',
      rate: '8',
    });
    await calculate();

    expect(screen.getByTestId('status-headline')).toHaveTextContent(
      "You're 6,783 miles ahead of your mileage allowance pace",
    );
    expect(screen.getByTestId('safe-monthly')).toHaveTextContent('525');
    expect(screen.getByTestId('safe-weekly')).toHaveTextContent('121');
    expect(screen.getByTestId('projected-end-mileage')).toHaveTextContent('47,443 miles');
    expect(screen.getByTestId('projected-excess')).toHaveTextContent('17,443 miles');
    expect(screen.getByTestId('estimated-charge')).toHaveTextContent('£1,395.43');
    expect(screen.getByText('38.9%')).toBeInTheDocument();
    expect(screen.getByText('61.5%')).toBeInTheDocument();
  });
});

describe('mileage status journeys', () => {
  it('IT-002 reports an under-pace driver with no charge', async () => {
    renderCalculator();
    await fillForm({
      allowance: '30000',
      contractLength: '36',
      currentOdometer: '10000',
      elapsedMonths: '18',
      rate: '10',
    });
    await calculate();

    expect(screen.getByText(/under pace/i)).toBeInTheDocument();
    expect(screen.getByTestId('projected-end-mileage')).toHaveTextContent('20,000 miles');
    expect(screen.getByTestId('estimated-charge')).toHaveTextContent('£0.00');
  });

  it('IT-003 reports an on-track driver', async () => {
    renderCalculator();
    await fillForm({
      allowance: '30000',
      contractLength: '36',
      currentOdometer: '15000',
      elapsedMonths: '18',
      rate: '10',
    });
    await calculate();

    expect(screen.getByText('On track')).toBeInTheDocument();
    expect(screen.getByTestId('projected-end-mileage')).toHaveTextContent('30,000 miles');
  });

  it('IT-004 reports an over-pace driver with a £1,000 charge', async () => {
    renderCalculator();
    await fillForm({
      allowance: '30000',
      contractLength: '36',
      currentOdometer: '20000',
      elapsedMonths: '18',
      rate: '10',
    });
    await calculate();

    expect(screen.getByTestId('projected-excess')).toHaveTextContent('10,000 miles');
    expect(screen.getByTestId('estimated-charge')).toHaveTextContent('£1,000.00');
  });

  it('IT-005 uses miles driven rather than the raw odometer', async () => {
    renderCalculator();
    await fillForm({
      allowance: '30000',
      contractLength: '36',
      startOdometer: '12000',
      currentOdometer: '32000',
      elapsedMonths: '18',
    });
    await calculate();

    expect(screen.getByText('20,000 miles')).toBeInTheDocument();
    // 32,000 raw miles would be 106.7% of the allowance; 20,000 driven is 66.7%.
    expect(screen.getByText('66.7%')).toBeInTheDocument();
  });

  it('IT-011 clamps the safe target once the total allowance is exceeded', async () => {
    renderCalculator();
    await fillForm({
      allowance: '30000',
      contractLength: '36',
      currentOdometer: '31200',
      elapsedMonths: '26',
      rate: '10',
    });
    await calculate();

    expect(screen.getByTestId('status-headline')).toHaveTextContent(
      /exceeded your total contract allowance by 1,200 miles/i,
    );
    expect(screen.getByTestId('safe-monthly')).toHaveTextContent('0 miles remaining');
    expect(screen.getByText(/cannot remove mileage already driven/i)).toBeInTheDocument();
  });

  it('IT-012 handles a finished contract without dividing by zero', async () => {
    renderCalculator();
    await fillForm({
      allowance: '30000',
      contractLength: '36',
      currentOdometer: '31000',
      elapsedMonths: '36',
      rate: '10',
    });
    await calculate();

    expect(screen.getByTestId('forecast-heading')).toHaveTextContent(/at the end of your agreement/i);
    expect(screen.getByTestId('projected-end-mileage')).toHaveTextContent('31,000 miles');
    expect(screen.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
  });
});

describe('allowance modes and elapsed-time modes', () => {
  it('IT-015 shows the converted total for an annual allowance', async () => {
    renderCalculator();
    await typeInto(/annual mileage allowance/i, '10000');
    await typeInto(/contract length/i, '36');
    expect(screen.getByTestId('derived-total-allowance')).toHaveTextContent('30,000 miles');
  });

  it('IT-016 converts an annual allowance over a 42-month term', async () => {
    renderCalculator();
    await typeInto(/annual mileage allowance/i, '8000');
    await typeInto(/contract length/i, '42');
    expect(screen.getByTestId('derived-total-allowance')).toHaveTextContent('28,000 miles');
  });

  it('IT-013 hides months elapsed and shows the end date in date mode', async () => {
    renderCalculator();
    await typeInto(/contract length/i, '36');
    expect(screen.getByLabelText(/months elapsed/i)).toBeInTheDocument();

    await typeInto(/agreement start date/i, '2025-09-18');
    expect(screen.queryByLabelText(/months elapsed/i)).not.toBeInTheDocument();
    expect(screen.getByText('18 September 2028')).toBeInTheDocument();
  });

  it('IT-020 parses pasted values containing commas and spaces', async () => {
    renderCalculator();
    await fillForm({
      allowance: '30,000',
      contractLength: '36',
      currentOdometer: '18 450',
      elapsedMonths: '14',
      rate: '8',
    });
    await calculate();
    expect(screen.getByTestId('estimated-charge')).toHaveTextContent('£1,395.43');
  });
});

describe('charges, VAT and tiering', () => {
  it('IT-006 shows mileage results and a rate prompt when no rate is given', async () => {
    renderCalculator();
    await fillForm({
      allowance: '30000',
      contractLength: '36',
      currentOdometer: '18450',
      elapsedMonths: '14',
    });
    await calculate();

    expect(screen.getByTestId('projected-excess')).toHaveTextContent('17,443 miles');
    expect(screen.queryByTestId('estimated-charge')).not.toBeInTheDocument();
    expect(screen.getByText(/Add your contract rate above to estimate/i)).toBeInTheDocument();
  });

  it('IT-007 shows a base, VAT and total breakdown when VAT is additional', async () => {
    renderCalculator();
    await fillForm({
      allowance: '30000',
      contractLength: '36',
      currentOdometer: '16000',
      elapsedMonths: '18',
      rate: '10',
    });
    await user().click(screen.getByRole('button', { name: /advanced charge options/i }));
    await user().click(screen.getByRole('radio', { name: /added to my rate/i }));
    await calculate();

    const breakdown = screen.getByTestId('vat-breakdown');
    expect(within(breakdown).getByText('£200.00')).toBeInTheDocument();
    expect(within(breakdown).getByText('£40.00')).toBeInTheDocument();
    expect(screen.getByTestId('estimated-charge')).toHaveTextContent('£240.00');
  });

  it('never adds VAT when the treatment is unknown', async () => {
    renderCalculator();
    await fillForm({
      allowance: '30000',
      contractLength: '36',
      currentOdometer: '16000',
      elapsedMonths: '18',
      rate: '10',
    });
    await user().click(screen.getByRole('button', { name: /advanced charge options/i }));
    await user().click(screen.getByRole('radio', { name: /i'm not sure/i }));
    await calculate();

    expect(screen.getByTestId('estimated-charge')).toHaveTextContent('£200.00');
    expect(screen.getByTestId('vat-uncertain-note')).toBeInTheDocument();
    expect(screen.queryByTestId('vat-breakdown')).not.toBeInTheDocument();
  });

  it('IT-008 applies a tiered rate only when it is enabled and configured', async () => {
    renderCalculator();
    await fillForm({
      allowance: '30000',
      contractLength: '36',
      currentOdometer: '18500',
      elapsedMonths: '18',
      rate: '10',
    });
    await user().click(screen.getByRole('button', { name: /advanced charge options/i }));
    await user().click(screen.getByLabelText(/higher mileage rate after a threshold/i));
    await typeInto(/higher rate starts after/i, '5000');
    await typeInto(/^higher rate$/i, '15');
    await calculate();

    expect(screen.getByTestId('projected-excess')).toHaveTextContent('7,000 miles');
    expect(screen.getByTestId('estimated-charge')).toHaveTextContent('£800.00');

    await user().click(screen.getByRole('button', { name: /see charge breakdown/i }));
    const tiers = screen.getByTestId('tier-breakdown');
    expect(within(tiers).getByText('£500.00')).toBeInTheDocument();
    expect(within(tiers).getByText('£300.00')).toBeInTheDocument();
  });
});

describe('end-of-agreement wording (IT-009, IT-010)', () => {
  const setup = async (option: RegExp) => {
    renderCalculator();
    await fillForm({
      allowance: '30000',
      contractLength: '36',
      currentOdometer: '18450',
      elapsedMonths: '14',
      rate: '8',
    });
    await user().click(screen.getByRole('radio', { name: option }));
    await calculate();
  };

  it('IT-009 does not claim an excess charge is payable when buying the car', async () => {
    await setup(/buy \/ keep the car/i);
    expect(screen.getByText(/may not be charged in the same way as returning it/i)).toBeInTheDocument();
    expect(screen.getByTestId('charge-panel').className).toContain('deemphasised');
    expect(screen.getByText('Return-equivalent estimate')).toBeInTheDocument();
  });

  it('IT-010 frames part-exchange as a comparison, not an invoice', async () => {
    await setup(/part-exchange/i);
    expect(screen.getByText(/rather than a guaranteed invoice/i)).toBeInTheDocument();
    expect(screen.getByTestId('charge-panel').className).toContain('comparison');
  });

  it('shows the charge prominently when returning the car', async () => {
    await setup(/return the car/i);
    expect(screen.getByText('Estimated excess charge')).toBeInTheDocument();
    expect(screen.getByTestId('charge-panel').className).toContain('prominent');
  });
});

describe('scenario planner (IT-017, IT-018)', () => {
  const setup = async () => {
    renderCalculator();
    await fillForm({
      allowance: '30000',
      contractLength: '36',
      currentOdometer: '18450',
      elapsedMonths: '14',
      rate: '8',
    });
    await calculate();
  };

  it('IT-017 lowers the estimated charge when future mileage is reduced', async () => {
    await setup();
    await typeInto(/expected mileage from now/i, '525');

    expect(screen.getByTestId('scenario-end-mileage')).toHaveTextContent('30,000 miles');
    expect(screen.getByTestId('scenario-excess')).toHaveTextContent('0 miles');
    expect(screen.getByTestId('scenario-charge')).toHaveTextContent('£0.00');
    expect(screen.getByTestId('scenario-difference')).toHaveTextContent('£1,395.43 less');
  });

  it('IT-018 raises the estimated charge when future mileage is increased', async () => {
    await setup();
    await typeInto(/expected mileage from now/i, '2000');

    expect(screen.getByTestId('scenario-end-mileage')).toHaveTextContent('62,450 miles');
    expect(screen.getByTestId('scenario-difference')).toHaveTextContent('more');
  });

  it('offers a numeric alternative to the slider (WCAG 2.2)', async () => {
    await setup();
    const slider = screen.getByRole('slider', { name: /drag to adjust/i });
    const numeric = screen.getByLabelText(/expected mileage from now/i);
    expect(slider).toBeInTheDocument();
    expect(numeric).toHaveAttribute('inputmode', 'numeric');

    await typeInto(/expected mileage from now/i, '700');
    expect(slider).toHaveValue('700');
  });
});

describe('validation behaviour (IT-021, IT-022, FR-017)', () => {
  it('shows an error summary, keeps entered values and links to the field', async () => {
    renderCalculator();
    await fillForm({
      allowance: '30000',
      contractLength: '36',
      startOdometer: '12000',
      currentOdometer: '11999',
      elapsedMonths: '14',
      rate: '8',
    });
    await calculate();

    const summary = screen.getByRole('alert');
    expect(within(summary).getByText(/Current odometer cannot be lower/i)).toBeInTheDocument();
    expect(summary).toHaveFocus();

    // FR-017: nothing the user typed is lost.
    expect(screen.getByLabelText(/total contract mileage allowance/i)).toHaveValue('30000');
    expect(screen.getByLabelText(/current odometer reading/i)).toHaveValue('11999');

    // Field-level error is associated with the input.
    const field = screen.getByLabelText(/current odometer reading/i);
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field.getAttribute('aria-describedby')).toContain('currentOdometer-error');

    // No result is produced from invalid input.
    expect(screen.queryByTestId('estimated-charge')).not.toBeInTheDocument();
  });

  it('IT-022 blocks elapsed months greater than the contract length', async () => {
    renderCalculator();
    await fillForm({
      allowance: '30000',
      contractLength: '36',
      currentOdometer: '18450',
      elapsedMonths: '37',
    });
    await calculate();

    expect(
      screen.getByText('Months elapsed must be between 0 and your contract length of 36 months.', {
        selector: 'a',
      }),
    ).toBeInTheDocument();
  });

  it('rejects a start date in the future', async () => {
    renderCalculator();
    await fillForm({
      allowance: '30000',
      contractLength: '36',
      currentOdometer: '18450',
      startDate: '2027-01-01',
    });
    await calculate();

    expect(
      screen.getAllByText('Agreement start date cannot be in the future.').length,
    ).toBeGreaterThan(0);
  });

  it('does not validate while the user is still typing', async () => {
    renderCalculator();
    await typeInto(/annual mileage allowance/i, '1');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('clears an error once the user fixes it', async () => {
    renderCalculator();
    await fillForm({
      allowance: '30000',
      contractLength: '36',
      currentOdometer: '',
      elapsedMonths: '14',
    });
    await calculate();
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await typeInto(/current odometer reading/i, '18450');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('IT-019 reset', () => {
  it('clears all values and the result', async () => {
    renderCalculator();
    await fillForm({
      allowance: '30000',
      contractLength: '36',
      currentOdometer: '18450',
      elapsedMonths: '14',
      rate: '8',
    });
    await calculate();
    expect(screen.getByTestId('estimated-charge')).toBeInTheDocument();

    await user().click(screen.getByRole('button', { name: /reset calculator/i }));

    expect(screen.queryByTestId('estimated-charge')).not.toBeInTheDocument();
    expect(screen.getByText(/your mileage forecast will appear here/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/annual mileage allowance/i)).toHaveValue('');
    expect(screen.getByLabelText(/current odometer reading/i)).toHaveValue('');
    expect(screen.getByLabelText(/odometer when the agreement started/i)).toHaveValue('0');
  });
});

describe('IT-028 local persistence', () => {
  it('restores saved inputs and clears them on request', async () => {
    const { unmount } = render(<CalculatorSection asOfDate={AS_OF} persist />);
    await typeInto(/annual mileage allowance/i, '12000');
    unmount();

    render(<CalculatorSection asOfDate={AS_OF} persist />);
    expect(screen.getByLabelText(/annual mileage allowance/i)).toHaveValue('12000');

    await user().click(screen.getByRole('button', { name: /clear saved calculator data/i }));
    expect(screen.getByLabelText(/annual mileage allowance/i)).toHaveValue('');
  });
});

describe('empty and result states', () => {
  it('shows a thoughtful empty state rather than placeholder dashes', async () => {
    renderCalculator();
    expect(screen.getByText(/your mileage forecast will appear here/i)).toBeInTheDocument();
    expect(screen.getByText('Mileage position')).toBeInTheDocument();
    expect(screen.getByText('Monthly target')).toBeInTheDocument();
    expect(screen.getByText('Estimated cost')).toBeInTheDocument();
    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });

  it('IT-025 keeps every chart insight available as text', async () => {
    renderCalculator();
    await fillForm({
      allowance: '30000',
      contractLength: '36',
      currentOdometer: '18450',
      elapsedMonths: '14',
      rate: '8',
    });
    await calculate();

    await user().click(screen.getByRole('button', { name: /read the chart as text/i }));
    const summary = screen.getByRole('region', { name: /read the chart as text/i });
    expect(within(summary).getByText(/47,443 miles/)).toBeInTheDocument();
    expect(within(summary).getByText(/Contract allowance pace rises/)).toBeInTheDocument();
  });

  it('shows the estimate disclaimer next to the charge', async () => {
    renderCalculator();
    await fillForm({
      allowance: '30000',
      contractLength: '36',
      currentOdometer: '18450',
      elapsedMonths: '14',
      rate: '8',
    });
    await calculate();

    expect(screen.getByText('About this estimate')).toBeInTheDocument();
    expect(screen.getByText(/planning purposes only/i)).toBeInTheDocument();
    expect(screen.getByText('Estimate only')).toBeInTheDocument();
  });

  it('shows the full calculation breakdown on request', async () => {
    renderCalculator();
    await fillForm({
      allowance: '30000',
      contractLength: '36',
      currentOdometer: '18450',
      elapsedMonths: '14',
      rate: '8',
    });
    await calculate();

    await user().click(screen.getByRole('button', { name: /how we calculated this/i }));
    expect(screen.getByRole('row', { name: /Historical average pace/ })).toHaveTextContent('1,318');
    expect(screen.getByRole('row', { name: /Base charge/ })).toHaveTextContent('£1,395.43');
  });
});

describe('IT-023/IT-024 accessibility of the page', () => {
  it('has one h1 and a logical landmark structure', () => {
    render(<App asOfDate={AS_OF} persist={false} />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('labels every form control', () => {
    renderCalculator();
    for (const field of screen.getAllByRole('textbox')) {
      expect(field).toHaveAccessibleName();
    }
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toHaveAccessibleName();
    }
  });

  it('uses numeric input modes on mileage fields (FR-019)', () => {
    renderCalculator();
    expect(screen.getByLabelText(/annual mileage allowance/i)).toHaveAttribute(
      'inputmode',
      'numeric',
    );
    expect(screen.getByLabelText(/excess mileage rate/i)).toHaveAttribute('inputmode', 'decimal');
  });

  it('operates the FAQ accordion from the keyboard', async () => {
    render(<App asOfDate={AS_OF} persist={false} />);
    const trigger = screen.getByRole('button', { name: /how is excess mileage calculated/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    trigger.focus();
    await user().keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('announces the result without announcing every keystroke', async () => {
    renderCalculator();
    await fillForm({
      allowance: '30000',
      contractLength: '36',
      currentOdometer: '18450',
      elapsedMonths: '14',
      rate: '8',
    });
    await calculate();

    const statuses = screen.getAllByRole('status');
    expect(statuses.some((node) => /Results updated/i.test(node.textContent ?? ''))).toBe(true);
  });
});
