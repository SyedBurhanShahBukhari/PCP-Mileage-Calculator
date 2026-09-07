=== PCP Mileage Calculator ===
Contributors: pcpmileage
Tags: calculator, car finance, pcp, mileage, motoring
Requires at least: 5.8
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.1.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

An accessible PCP mileage calculator: are you on track, what can you safely drive from now, and what might excess mileage cost?

== Description ==

Adds a mileage calculator for UK PCP (personal contract purchase) customers to any page or post.

A visitor enters their mileage allowance, contract length, starting and current odometer readings, and optionally their excess mileage rate. They immediately see:

* whether they are ahead of, on, or behind their allowance pace
* how many miles they can safely drive each month and week from now
* their projected mileage at the end of the agreement
* their projected excess miles and an estimated charge
* a chart of allowance pace against their projected pace
* a planner for testing a different future driving pace

**Everything is calculated in the visitor's browser.** No data is sent to your server or anywhere else. No account, email address or vehicle registration is asked for, and no external requests are made — the plugin loads no fonts, trackers or third-party scripts.

= Careful about what it claims =

The calculator presents an estimate, never a settlement figure:

* It never substitutes a "typical" pence-per-mile rate the visitor did not enter.
* It never adds VAT when the VAT treatment is unknown — it shows the figure before any additional VAT instead.
* It applies a tiered rate only when the visitor explicitly enables and configures one.
* If the visitor says they plan to buy the vehicle, it de-emphasises the charge and explains it may not be charged in the same way as returning it.
* For a part-exchange it presents the figure as a return-cost comparison, not an invoice.
* A disclaimer sits next to the cost estimate, and nothing is presented as financial advice.

= Accessibility =

Built to WCAG 2.2 AA: semantic headings and landmarks, persistent visible labels, hints and errors linked with aria-describedby, an error summary that takes focus and links to each field, full keyboard operation with visible focus, a keyboard-navigable chart with a complete text equivalent, a numeric alternative to the scenario slider, status conveyed by text and icon as well as colour, and support for reduced-motion preferences.

== Installation ==

1. Go to **Plugins → Add New → Upload Plugin** and upload the plugin .zip file.
2. Activate **PCP Mileage Calculator**.
3. Add the calculator to a page in either of two ways:
   * In the block editor, insert the **PCP Mileage Calculator** block.
   * Anywhere shortcodes work, use `[pcp_mileage_calculator]`.

= Shortcode attributes =

`[pcp_mileage_calculator]`

* `sections` — `calculator` (default) shows the tool alone. `full` also adds the "how it works", explanation and FAQ sections.
* `heading` — optional heading rendered above the calculator. Leave it out if your page already has one.
* `persist` — `yes` (default) or `no`. Saves the visitor's entries to their own browser only, with a clear-data button.
* `faq_schema` — `yes` or `no` (default). Only applies with `sections="full"`. Leave it off if an SEO plugin already publishes FAQ structured data on the page.
* `class` — an extra CSS class on the wrapper, if you want to target it from your theme.

Examples:

`[pcp_mileage_calculator]`
`[pcp_mileage_calculator heading="Check your PCP mileage"]`
`[pcp_mileage_calculator sections="full" faq_schema="yes"]`
`[pcp_mileage_calculator persist="no"]`

== Frequently Asked Questions ==

= Will it change how the rest of my site looks? =

No. Every style the plugin ships is scoped under a single `.pcp-mc` wrapper class, so it cannot affect your theme's headings, forms, buttons or body text. Assets are only loaded on pages that actually contain the calculator.

= Does it collect any data? =

No. There is no server-side processing at all: the calculator runs entirely in the visitor's browser. If "remember entries" is on, entries are stored in that visitor's own browser using local storage, which never reaches your server, and the calculator shows a button to clear it.

= Does it work with page builders? =

Yes, anywhere shortcodes are supported — Elementor, Beaver Builder, Divi, WPBakery and the classic editor all work through `[pcp_mileage_calculator]`.

= Is the explanatory content good for SEO? =

The `sections="full"` content is rendered by JavaScript, so it suits visitors better than crawlers. For search visibility, use the default `sections="calculator"` and write your own explanatory content and FAQs as normal WordPress content around it.

= My theme sets a 62.5% root font size and the calculator looks small. =

A few older themes set `html { font-size: 62.5% }`. Add this to Appearance → Customise → Additional CSS:

`.pcp-mileage-calculator-embed { font-size: 16px; }`
`html { font-size: 100%; }`

Or, if you cannot change the root size, contact your theme author — the calculator sizes itself in `rem` so that it respects the visitor's own font-size preference.

= Can I change the wording or colours? =

The colours are CSS custom properties on the `.pcp-mc` wrapper, so you can override them in Additional CSS, for example:

`.pcp-mc { --primary: #0b5fff; --primary-dark: #10233a; }`

== Screenshots ==

1. The calculator with a completed result: mileage position, safe monthly target and end-of-contract forecast.
2. The mileage projection chart, with allowance pace and projected pace.
3. The what-if planner comparing current pace against a chosen pace.

== Changelog ==

= 1.1.0 =
* Redesigned the results dashboard: each result now leads with a single large figure rather than a paragraph.
* Replaced the two separate progress bars with one pace meter carrying an "on-pace" marker, so the comparison is read in one place.
* Rebuilt the mileage chart. The gap between your contract allowance and your projected pace is now shaded and quantified, the pace line is solid for miles already driven and dashed only for the projection ahead, each line is labelled at its end, and hovering (or focusing and using the arrow keys) shows a tooltip for any month.
* Projected end-of-contract figures are now compact stat tiles, with the estimated charge as the focal figure.
* Tightened the chart's y-axis so the top gridline sits close to the data.

= 1.0.0 =
* First release: calculator, validation, chart, what-if planner, VAT and tiered-rate handling, end-of-agreement wording, block and shortcode.
