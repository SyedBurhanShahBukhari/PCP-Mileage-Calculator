import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EmbeddedCalculator } from '../src/components/EmbeddedCalculator';

/** The tree the WordPress plugin (and any other host page) mounts. */
const AS_OF = '2026-09-07';

afterEach(cleanup);
beforeEach(() => window.localStorage.clear());

describe('EmbeddedCalculator', () => {
  it('renders inside a single scoping wrapper', () => {
    const { container } = render(<EmbeddedCalculator asOfDate={AS_OF} persist={false} />);
    const wrappers = container.querySelectorAll('.pcp-mc');
    expect(wrappers).toHaveLength(1);
    expect(wrappers[0]).toContainElement(screen.getByLabelText(/annual mileage allowance/i));
  });

  it('omits the site chrome, so the host page keeps its own header, hero and h1', () => {
    render(<EmbeddedCalculator asOfDate={AS_OF} persist={false} />);
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('shows the calculator alone by default', () => {
    render(<EmbeddedCalculator asOfDate={AS_OF} persist={false} />);
    expect(screen.getByRole('heading', { name: /pcp mileage calculator/i })).toBeInTheDocument();
    expect(screen.queryByText(/frequently asked questions/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/understanding your pcp mileage allowance/i)).not.toBeInTheDocument();
  });

  it('adds the explanatory content in full mode', () => {
    render(<EmbeddedCalculator sections="full" asOfDate={AS_OF} persist={false} />);
    expect(screen.getByText(/how the pcp mileage calculator works/i)).toBeInTheDocument();
    expect(screen.getByText(/understanding your pcp mileage allowance/i)).toBeInTheDocument();
    expect(screen.getByText(/frequently asked questions/i)).toBeInTheDocument();
  });

  it('renders an optional heading at level 2, below the host page h1', () => {
    render(<EmbeddedCalculator heading="Check your PCP mileage" asOfDate={AS_OF} persist={false} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Check your PCP mileage' })).toBeInTheDocument();
  });

  it('omits FAQ structured data unless the host opts in', () => {
    const { container, unmount } = render(
      <EmbeddedCalculator sections="full" asOfDate={AS_OF} persist={false} />,
    );
    expect(container.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(0);
    unmount();

    const optedIn = render(
      <EmbeddedCalculator sections="full" faqSchema asOfDate={AS_OF} persist={false} />,
    );
    const schema = optedIn.container.querySelectorAll('script[type="application/ld+json"]');
    expect(schema).toHaveLength(1);
    expect(JSON.parse(schema[0].textContent ?? '{}')['@type']).toBe('FAQPage');
  });

  it('writes nothing to local storage when persistence is off', () => {
    render(<EmbeddedCalculator asOfDate={AS_OF} persist={false} />);
    expect(window.localStorage.length).toBe(0);
  });
});
