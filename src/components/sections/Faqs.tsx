import { useState } from 'react';
import { Icon } from '../ui/Icon';
import { FAQS } from '../../content/faqs';

/**
 * FAQPage structured data. Every question and answer below is visible on the
 * page in the same wording, which is what search-engine guidance requires.
 */
const FAQ_SCHEMA = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
});

/** Accessible accordion: real buttons, `aria-expanded`, one heading per item. */
export function Faqs({ includeSchema = true }: { includeSchema?: boolean }) {
  const [open, setOpen] = useState<string | null>(FAQS[0].id);

  return (
    <section className="section section--tint" id="faqs" aria-labelledby="faqs-title">
      <div className="container container--narrow">
        <h2 className="section-heading" id="faqs-title">
          Frequently asked questions
        </h2>

        {includeSchema && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: FAQ_SCHEMA }} />
        )}

        <div className="accordion">
          {FAQS.map((faq) => {
            const isOpen = open === faq.id;
            return (
              <div className={`accordion__item${isOpen ? ' is-open' : ''}`} key={faq.id}>
                <h3 className="accordion__heading">
                  <button
                    type="button"
                    className="accordion__trigger"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${faq.id}`}
                    id={`faq-trigger-${faq.id}`}
                    onClick={() => setOpen(isOpen ? null : faq.id)}
                  >
                    <span>{faq.question}</span>
                    <Icon name="chevron" size={20} className="accordion__chevron" />
                  </button>
                </h3>
                <div
                  className="accordion__panel"
                  id={`faq-panel-${faq.id}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${faq.id}`}
                  hidden={!isOpen}
                >
                  <p>{faq.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
