export function SiteFooter() {
  return (
    <footer className="site-footer no-print" id="disclaimer">
      <div className="container site-footer__inner">
        <nav aria-label="Footer">
          <ul className="footer-nav">
            <li>
              <a href="#calculator">Calculator</a>
            </li>
            <li>
              <a href="#how-it-works">How it works</a>
            </li>
            <li>
              <a href="#faqs">FAQs</a>
            </li>
            <li>
              <a href="#privacy">Privacy</a>
            </li>
            <li>
              <a href="#disclaimer">Disclaimer</a>
            </li>
          </ul>
        </nav>

        <div className="site-footer__legal">
          <p id="privacy">
            <strong>Privacy:</strong> everything you enter is calculated in your browser. Nothing is
            sent to a server, and no account, email address or vehicle registration is required.
          </p>
          <p>
            This calculator provides estimates for informational purposes and does not constitute
            financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
