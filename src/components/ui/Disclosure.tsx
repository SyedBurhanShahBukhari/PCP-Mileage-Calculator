import { useId, useState } from 'react';
import { Icon } from './Icon';

interface DisclosureProps {
  summary: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  tone?: 'default' | 'quiet';
}

/**
 * Standard disclosure: a real button with `aria-expanded` controlling a region.
 * Content is unmounted when closed so hidden fields never receive tab focus.
 */
export function Disclosure({ summary, children, defaultOpen = false, tone = 'default' }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const panelId = `${id}-panel`;
  const buttonId = `${id}-button`;

  return (
    <div className={`disclosure disclosure--${tone}${open ? ' is-open' : ''}`}>
      <button
        type="button"
        id={buttonId}
        className="disclosure__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="chevron" size={18} className="disclosure__chevron" />
        <span>{summary}</span>
      </button>
      <div
        className="disclosure__panel"
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!open}
      >
        {open && <div className="disclosure__content">{children}</div>}
      </div>
    </div>
  );
}
