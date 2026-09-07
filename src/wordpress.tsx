/**
 * WordPress entry point.
 *
 * Built as a self-contained IIFE bundle (React included) so it can be enqueued
 * with a plain `wp_enqueue_script` call — no module type, no import map and no
 * dependency on the React that WordPress ships, whose version varies by
 * release. Mounts into every placeholder the shortcode or block rendered.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { EmbeddedCalculator } from './components/EmbeddedCalculator';
import './styles/embed-reset.css';
import './styles/global.css';
import './styles/app.css';

const MOUNT_SELECTOR = '[data-pcp-mileage-calculator]';
const MOUNTED = 'pcpMileageMounted';

function readProps(element: HTMLElement) {
  return {
    sections: element.dataset.sections === 'full' ? ('full' as const) : ('calculator' as const),
    heading: element.dataset.heading || undefined,
    persist: element.dataset.persist !== 'no',
    faqSchema: element.dataset.faqSchema === 'yes',
    asOfDate: element.dataset.asOfDate || undefined,
  };
}

function mountAll() {
  const targets = document.querySelectorAll<HTMLElement>(MOUNT_SELECTOR);
  targets.forEach((element) => {
    // The block editor can re-run this script; never mount the same node twice.
    if (element.dataset[MOUNTED] === 'true') return;
    element.dataset[MOUNTED] = 'true';
    createRoot(element).render(
      <StrictMode>
        <EmbeddedCalculator {...readProps(element)} />
      </StrictMode>,
    );
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountAll);
} else {
  mountAll();
}

// Lets the block editor re-scan after inserting a fresh preview.
(window as unknown as { pcpMileageCalculator?: unknown }).pcpMileageCalculator = { mount: mountAll };
