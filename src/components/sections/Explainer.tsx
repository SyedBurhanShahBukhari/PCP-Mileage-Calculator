/** Crawlable explanatory content (spec §31, NFR-008). */
export function Explainer() {
  return (
    <section className="section section--tint" id="mileage-guide" aria-labelledby="explainer-title">
      <div className="container container--narrow">
        <h2 className="section-heading" id="explainer-title">
          Understanding your PCP mileage allowance
        </h2>

        <div className="prose">
          <p>
            A personal contract purchase agreement usually sets a mileage limit. It may be quoted as
            a figure per year, but what matters at the end is the total across the whole term: a
            10,000-mile annual allowance on a 36-month agreement is 30,000 miles in total.
          </p>
          <p>
            Because the allowance is a total, a heavy year can be balanced by a lighter one. Driving
            above the straight-line pace today does not mean a charge is certain — it means you have
            less headroom for the rest of the agreement. The safe monthly figure on this page is the
            pace that would still land inside your allowance.
          </p>
          <p>
            Excess mileage charges depend entirely on your finance agreement. The pence-per-mile
            rate, whether VAT is included or added, and whether a higher rate applies above a
            threshold are all set out there. This calculator never assumes a rate you have not
            entered, and never adds VAT unless you tell it VAT is additional.
          </p>
          <p>
            The projection assumes your driving so far is representative of the rest of the term. If
            that is not true — a house move, a new commute, a long trip already behind you — use the
            planner to enter the mileage you actually expect from now on.
          </p>
        </div>
      </div>
    </section>
  );
}
