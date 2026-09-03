import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, ChevronRight, User, Calendar, Send, ClipboardList, MessageSquare, Building, FileText } from "lucide-react";

const PlotPriceInPondicherry = () => {
  useEffect(() => {
    // Scroll to top on mount
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: "instant" });
    }
  }, []);

  return (
    <div className="blog-detail-wrapper">
      <style>{`
        .blog-detail-wrapper {
          --coral: #fb2c36;
          --coral-hover: #e0242c;
          --ocean: #006699;
          --navy: #1A2B4C;
          --navy-deep: #0D1B2A;
          --primary: #166aa8;
          --whatsapp: #166aa8;
          --amber-fill: #FFF3E0;
          --amber-text: #D97706;
          --blue-fill: #E6F2FA;
          --green-fill: #E6F2FA;
          --bg: #F8F9FA;
          --white: #FFFFFF;
          --ink: #1A2129;
          --gray: #667085;
          --line: #E7E9EC;
          background: var(--bg);
          color: var(--ink);
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;
          line-height: 1.7;
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
          padding-top: 100px;
        }

        .blog-detail-wrapper h1,
        .blog-detail-wrapper h2,
        .blog-detail-wrapper h3,
        .blog-detail-wrapper h4 {
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
          letter-spacing: -0.01em;
          margin: 0;
        }

        .blog-detail-wrapper p {
          margin: 0 0 16px;
          font-size: 1.02rem;
          color: #374151;
        }

        /* PAGE CONTAINER / GRID */
        .blog-page {
          max-width: 1180px;
          margin: 0 auto;
          padding: 20px 5% 60px;
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 36px;
          align-items: start;
        }

        .blog-detail-wrapper main {
          background: transparent;
        }

        /* BREADCRUMB */
        .blog-breadcrumb {
          font-size: 0.85rem;
          color: var(--gray);
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .blog-breadcrumb a {
          color: var(--gray);
          font-weight: 500;
        }
        .blog-breadcrumb a:hover {
          color: var(--ocean);
        }

        /* CATEGORY PILL */
        .cat-pill {
          display: inline-block;
          background: var(--blue-fill);
          color: var(--primary);
          font-weight: 800;
          font-size: 0.72rem;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          padding: 7px 14px;
          border-radius: 100px;
          margin-bottom: 16px;
        }

        h1.title {
          font-size: 2.2rem;
          line-height: 1.25;
          font-weight: 600;
          color: #0A0E14;
          margin-bottom: 20px;
        }

        .byline {
          display: flex;
          align-items: center;
          gap: 22px;
          color: var(--gray);
          font-size: 0.9rem;
          font-weight: 500;
          padding-bottom: 24px;
          margin-bottom: 28px;
          border-bottom: 1px solid var(--line);
        }
        .byline span {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .hero-img {
          width: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          border-radius: 16px;
          display: block;
          box-shadow: 0 12px 32px rgba(13,27,42,0.12);
          margin-bottom: 32px;
        }

        /* CALLOUT */
        .callout {
          background: var(--blue-fill);
          border-left: 4px solid var(--primary);
          border-radius: 0 12px 12px 0;
          padding: 22px 26px;
          margin: 28px 0 34px;
        }
        .callout h4 {
          color: var(--navy-deep);
          font-size: 1.15rem;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .callout p {
          margin: 0;
          color: #334155;
          font-size: 0.98rem;
        }

        /* NUMBERED SUBSECTIONS */
        .subsection {
          margin: 44px 0;
        }
        .subsection h3 {
          font-size: 1.4rem;
          color: var(--navy-deep);
          font-weight: 800;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .num-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: #0d1b2a;
          color: var(--white);
          font-size: 1.1rem;
          font-weight: 800;
          flex-shrink: 0;
        }
        .subsection img {
          width: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          border-radius: 14px;
          display: block;
          margin-bottom: 16px;
          box-shadow: 0 8px 24px rgba(13,27,42,0.1);
        }
        .subsection p {
          color: #374151;
          font-size: 1rem;
        }
        .subsection ul {
          padding-left: 22px;
          margin: 0 0 16px;
        }
        .subsection li {
          margin-bottom: 8px;
          font-size: 1rem;
          color: #374151;
        }

        .cta-pill-wrap {
          text-align: center;
          margin-top: 20px;
        }
        .cta-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--primary);
          color: var(--white) !important;
          font-weight: 700;
          font-size: 0.95rem;
          padding: 14px 28px;
          border-radius: 100px;
          transition: all 0.2s ease;
          box-shadow: 0 6px 18px rgba(22, 106, 168, 0.3);
        }
        .cta-pill:hover {
          background: #125a91 !important;
          color: var(--white) !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(22, 106, 168, 0.4);
        }

        /* PRICE TABLE */
        .table-wrap {
          overflow-x: auto;
          margin: 20px 0 24px;
          border-radius: 14px;
          box-shadow: 0 4px 20px rgba(13,27,42,0.06);
          border: 1px solid var(--line);
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.92rem;
          background: var(--white);
        }
        th, td {
          padding: 13px 16px;
          text-align: left;
          border-bottom: 1px solid var(--line);
          white-space: nowrap;
        }
        th {
          background: var(--navy-deep);
          color: var(--white);
          font-weight: 700;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        tr:nth-child(even) {
          background: #FAFBFC;
        }
        td:nth-child(2) {
          color: var(--coral);
          font-weight: 700;
        }
        .price-note {
          font-size: 0.85rem;
          color: var(--gray);
          font-style: italic;
          margin-top: -10px;
          margin-bottom: 20px;
        }

        /* WHO BENEFITS / WHY CHOOSE / SUCCESS */
        .who-benefits, .why-choose, .success-stories {
          margin: 50px 0;
        }
        .who-benefits h2, .why-choose h2, .success-stories h2 {
          font-size: 1.7rem;
          color: var(--navy-deep);
          font-weight: 800;
          margin-bottom: 16px;
        }
        .who-benefits img {
          width: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          border-radius: 14px;
          display: block;
          margin-bottom: 16px;
          box-shadow: 0 8px 24px rgba(13,27,42,0.1);
        }

        .why-list {
          list-style: none;
          padding: 0;
          margin: 20px 0 24px;
        }
        .why-list li {
          padding: 16px 0 16px 36px;
          position: relative;
          border-bottom: 1px solid var(--line);
          font-size: 1.02rem;
          color: #374151;
        }
        .why-list li:last-child {
          border-bottom: none;
        }
        .why-list li::before {
          content: "●";
          position: absolute;
          left: 0;
          color: var(--coral);
          font-size: 1.2rem;
          top: 16px;
        }
        .why-list b {
          color: var(--navy-deep);
          font-weight: 800;
        }

        /* SUCCESS STORIES */
        .success-card {
          background: var(--navy-deep);
          border-radius: 16px;
          padding: 32px 34px;
          color: var(--white);
        }
        .stars {
          color: var(--amber-text);
          font-size: 1.1rem;
          margin-bottom: 14px;
          letter-spacing: 2px;
        }
        .success-card p.quote {
          color: #D6DEEA;
          font-size: 1.05rem;
          font-style: italic;
          margin-bottom: 16px;
        }
        .success-card .client {
          font-weight: 800;
          color: var(--white);
          font-size: 0.98rem;
        }
        .success-card .client span {
          display: block;
          color: #8B9AB3;
          font-weight: 500;
          font-size: 0.85rem;
          margin-top: 2px;
        }

        /* FINAL CTA BLOCK */
        .final-cta {
          background: linear-gradient(135deg, #0D1B2A 0%, #1A2B4C 100%);
          border-radius: 20px;
          padding: 56px 6%;
          margin: 56px 0 10px;
          text-align: center;
        }
        .final-cta h2 {
          color: var(--white);
          font-size: 1.9rem;
          font-weight: 800;
          margin-bottom: 14px;
        }
        .final-cta p {
          color: #C7D2E0;
          font-size: 1.05rem;
          max-width: 520px;
          margin: 0 auto 28px;
        }
        .final-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: var(--amber-text);
          color: #ede9e5ff !important;
          font-weight: 800;
          font-size: 1rem;
          padding: 16px 34px;
          border-radius: 100px;
          transition: all 0.2s ease;
        }
        .final-cta-btn:hover {
          background: #B8690A !important;
          color: var(--white) !important;
          transform: translateY(-2px);
        }

        /* SIDEBAR */
        .blog-aside {
          position: sticky;
          top: 110px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .side-card {
          background: var(--white);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(13,27,42,0.05);
        }
        .side-label {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          color: var(--gray);
          margin-bottom: 14px;
        }
        .brand-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .brand-row .name {
          font-weight: 700;
          color: var(--navy-deep);
          font-size: 1.02rem;
        }
        .side-card .desc {
          font-size: 0.92rem;
          color: var(--gray);
          margin-bottom: 16px;
        }
        .side-divider {
          border: none;
          border-top: 1px solid var(--line);
          margin: 16px 0;
        }
        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .tag-chip {
          background: #F1F3F5;
          color: #4B5563;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 100px;
        }

        .side-card.consult {
          background: var(--blue-fill);
          border-color: #BFE0F2;
        }
        .side-card.consult h4 {
          color: var(--primary);
          font-size: 1.15rem;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .side-card.consult p {
          color: #3f556b;
          font-size: 0.92rem;
          margin-bottom: 18px;
        }
        .wa-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          background: var(--primary);
          color: var(--white) !important;
          font-weight: 700;
          font-size: 0.95rem;
          padding: 14px;
          border-radius: 100px;
          transition: all 0.2s ease;
        }
        .wa-btn:hover {
          background: #125a91 !important;
          color: var(--white) !important;
          transform: translateY(-2px);
        }

        /* PRICE SNAPSHOT SIDEBAR */
        .side-card.price h4 {
          color: var(--navy-deep);
          font-size: 1.02rem;
          font-weight: 800;
          margin-bottom: 12px;
        }
        .mini-price-row {
          display: flex;
          justify-content: space-between;
          padding: 9px 0;
          border-bottom: 1px dashed var(--line);
          font-size: 0.88rem;
        }
        .mini-price-row:last-child {
          border-bottom: none;
        }
        .mini-price-row span:first-child {
          color: #374151;
          font-weight: 600;
        }
        .mini-price-row span:last-child {
          color: var(--coral);
          font-weight: 700;
        }

        @media(max-width: 900px) {
          .blog-page {
            grid-template-columns: 1fr;
            padding: 28px 5% 40px;
          }
          .blog-aside {
            position: static;
          }
        }
      `}</style>

      <div className="blog-page">
        <main>
          <div className="blog-breadcrumb flex items-center gap-1.5 flex-wrap">
            <Home className="w-4 h-4 text-gray-500" />
            <Link to="/">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <Link to="/blog">Blog</Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-800 font-semibold truncate">Pricing &amp; Investment Guide</span>
          </div>

          <div className="cat-pill">Pricing &amp; Investment Guide</div>

          <h1 className="title">
            Plot Price in Pondicherry (Area-Wise) – Complete Guide for Home Buyers &amp; Investors
          </h1>

          <div className="byline">
            <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-[#166aa8]" /> The Plot One Team</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#166aa8]" /> 30 July 2026</span>
          </div>

          <img
            className="hero-img"
            src="/blog/pondicherry-growth.webp"
            alt="Aerial view of NH332 highway lined with palm trees connecting Puducherry and Villupuram"
          />

          <p>
            Pondicherry has become one of South India's fastest-growing real estate destinations. Whether you're
            planning to build your dream home, invest for long-term appreciation, or purchase land for your family,
            understanding the plot price in Pondicherry is the first step toward making a smart investment.
          </p>

          <p>
            Many buyers from Chennai, Villupuram, Cuddalore, Tindivanam, and other parts of Tamil Nadu are choosing
            Pondicherry for its peaceful lifestyle, excellent connectivity, tourism growth, and increasing infrastructure.
            But one question every buyer asks is: <strong>"How much does a plot cost in Pondicherry?"</strong> The answer
            depends on location, DTCP approval, road width, nearby amenities, and future development plans.
          </p>

          <div className="callout">
            <h4>What Actually Decides a Plot's Price?</h4>
            <p>
              Two plots in the same town can differ by ₹2,000+ per sq.ft. The gap almost always comes down to five things:
              location, DTCP approval status, road width, nearby amenities, and upcoming infrastructure — not the size of the plot alone.
            </p>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">1</span> Why Plot Prices in Pondicherry Are Increasing
            </h3>
            <img
              src="/blog/pondicherry-growth.webp"
              alt="Aerial view of Pondicherry city buildings near the water"
            />
            <p>
              Property prices have steadily climbed thanks to excellent connectivity — ECR, NH-32, the Chennai–Pondicherry
              corridor, and Villupuram Railway Junction all make commuting easy for Chennai professionals. Add to that rising
              tourism, growing commercial demand, and a lifestyle with less traffic, cleaner air, and good schools and hospitals,
              and it's easy to see why families are choosing to settle here for good.
            </p>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">2</span> Factors That Affect Plot Price
            </h3>
            <img
              src="/blog/dtcp-approved-plots.webp"
              alt="Aerial view of land divided by an approach road"
            />
            <p>
              Not every plot is priced the same. Prime <strong>location</strong>, <strong>DTCP approval</strong>, wider
              <strong>road frontage</strong> or corner sites, and proximity to schools, hospitals, bus routes, and IT parks
              all push prices up. Upcoming infrastructure projects can also significantly increase a plot's value over the next
              few years — which is why it pays to check the master plan, not just today's map.
            </p>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">3</span> Area-Wise Plot Price in Pondicherry
            </h3>
            <img
              src="https://images.unsplash.com/photo-1569157087866-f4a8e9250605?auto=format&fit=crop&w=1200&q=80"
              alt="Mustard-yellow colonial house in Pondicherry's French Quarter"
            />
            <p>
              The table below gives an approximate idea of residential plot pricing. Actual prices vary depending on approval
              status, road frontage, plot size, and market demand.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Area</th><th>Price / Sq.ft.</th><th>Suitable For</th></tr>
                </thead>
                <tbody>
                  <tr><td>Lawspet</td><td>₹4,500 – ₹8,000</td><td>Premium residential living</td></tr>
                  <tr><td>JIPMER Area</td><td>₹3,800 – ₹7,000</td><td>Home buyers &amp; investors</td></tr>
                  <tr><td>Kottakuppam</td><td>₹3,500 – ₹6,500</td><td>Residential &amp; rental investment</td></tr>
                  <tr><td>ECR Corridor</td><td>₹4,000 – ₹8,500</td><td>Luxury homes &amp; long-term investment</td></tr>
                  <tr><td>Pondicherry University Road</td><td>₹3,000 – ₹5,500</td><td>Future appreciation</td></tr>
                  <tr><td>Villianur</td><td>₹2,000 – ₹4,000</td><td>Budget home buyers</td></tr>
                  <tr><td>Villupuram Road</td><td>₹1,800 – ₹3,800</td><td>Affordable investment</td></tr>
                  <tr><td>Cuddalore Road</td><td>₹2,500 – ₹5,000</td><td>Residential development</td></tr>
                  <tr><td>Tindivanam Road</td><td>₹1,700 – ₹3,500</td><td>Long-term investment</td></tr>
                </tbody>
              </table>
            </div>
            <p className="price-note">Note: Prices are indicative and may vary depending on market conditions, approvals, and project-specific features.</p>
            <p>
              <strong>Lawspet</strong> leads for families wanting an established, well-connected neighbourhood.
              <strong>ECR</strong> commands premium pricing for beach proximity and long-term appreciation.
              <strong>Villianur</strong> and <strong>Tindivanam Road</strong> remain the best entry points for first-time and budget-conscious buyers.
            </p>
            {/* CTA 1: Browse Properties Navigation */}
            <div className="cta-pill-wrap">
              <Link to="/properties" className="cta-pill">
                <Building className="w-4 h-4" /> Explore Properties in Pondicherry
              </Link>
            </div>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">4</span> Should You Buy a DTCP-Approved Plot?
            </h3>
            <img
              src="/blog/land-registration-docs.webp"
              alt="Close-up of hands reviewing property documents and paperwork on a desk"
            />
            <p>
              Absolutely. DTCP-approved plots may cost slightly more, but they bring legal clarity, better resale value,
              easier bank loan approval, and planned infrastructure. Before finalizing any purchase, verify the parent documents,
              patta, Encumbrance Certificate (EC), DTCP approval, and survey details — and always visit the site in person rather
              than relying on photos or brochures.
            </p>
          </div>

          <div className="who-benefits">
            <h2>Who Benefits Most From Pondicherry's Pricing Trends?</h2>
            <img
              src="/blog/pondicherry-growth.webp"
              alt="Team collaborating around a table"
            />
            <p>
              Chennai investors get better affordability and a weekend-getaway destination with strong long-term appreciation.
              First-time buyers get lower-priced entry points in Villianur and Tindivanam Road. Families get premium, well-connected
              neighbourhoods like Lawspet. And long-term investors get a limited-supply asset that keeps compounding in value as
              infrastructure improves.
            </p>
          </div>

          <div className="why-choose">
            <h2>Why Choose The Plot One</h2>
            <ul className="why-list">
              <li>
                <b>Proven Results</b> — verified residential plots across Pondicherry, Kottakuppam, Lawspet, Villianur,
                Cuddalore, Villupuram, and Tindivanam.
              </li>
              <li>
                <b>Transparent Pricing</b> — no hidden costs, with clear area-wise price guidance before you commit.
              </li>
              <li>
                <b>End-to-End Support</b> — document verification, site visits, and investment guidance from enquiry to registration.
              </li>
            </ul>
            {/* CTA 2: Post Requirement Navigation */}
            <div className="cta-pill-wrap">
              <Link to="/post-requirement" className="cta-pill">
                <FileText className="w-4 h-4" /> Post Your Plot Requirement
              </Link>
            </div>
          </div>

          <div className="success-stories">
            <h2>Success Stories</h2>
            <div className="success-card">
              <div className="stars">★★★★★</div>
              <p className="quote">
                "We were first-time buyers and had no idea what to check. The Plot One walked us through
                every document and got us a DTCP-approved plot near Lawspet within our budget."
              </p>
              <div className="client">
                Ramesh &amp; Priya <span>Investors, ECR Corridor</span>
              </div>
            </div>
          </div>

          <div className="final-cta">
            <h2>Ready to Find Your Perfect Plot?</h2>
            <p>
              Get our latest verified plot list with area-wise pricing across Pondicherry, Cuddalore, Villupuram,
              Tindivanam, and nearby areas — and book a free site visit.
            </p>
            <a
              className="final-cta-btn"
              href="https://wa.me/919403892971?text=Hi%2C%20I%27d%20like%20the%20verified%20plot%20list%20with%20area-wise%20pricing%20for%20Pondicherry."
              target="_blank"
              rel="noopener noreferrer"
            >
              <ClipboardList className="w-5 h-5 mr-1" /> Get the Verified Plot-List
            </a>
          </div>
        </main>

        <aside className="blog-aside">
          <div className="side-card">
            <div className="side-label">About The Plot One</div>
            <div className="brand-row">
              <img src="/Logo/logo.webp" alt="The Plot One" className="w-14 h-14 object-contain shrink-0" />
              <div className="name">The Plot One</div>
            </div>
            <p className="desc">
              Pondicherry's trusted real estate partner, helping buyers invest with confidence through verified plots
              and transparent, area-wise pricing.
            </p>
            <hr className="side-divider" />
            <div className="tags">
              <span className="tag-chip">#PlotPrice</span>
              <span className="tag-chip">#Pondicherry</span>
              <span className="tag-chip">#DTCPApproved</span>
              <span className="tag-chip">#ECR</span>
            </div>
          </div>

          <div className="side-card price">
            <h4>Quick Price Snapshot (per sq.ft.)</h4>
            <div className="mini-price-row"><span>Lawspet</span><span>₹4,500–8,000</span></div>
            <div className="mini-price-row"><span>ECR Corridor</span><span>₹4,000–8,500</span></div>
            <div className="mini-price-row"><span>Kottakuppam</span><span>₹3,500–6,500</span></div>
            <div className="mini-price-row"><span>Villianur</span><span>₹2,000–4,000</span></div>
            <div className="mini-price-row"><span>Tindivanam Rd</span><span>₹1,700–3,500</span></div>
          </div>

          <div className="side-card consult">
            <h4>Need a Consultation?</h4>
            <p>Talk to our team about current pricing, verified plots, and site visits — no obligation.</p>
            <a
              className="wa-btn"
              href="https://wa.me/919403892971?text=Hi%2C%20I%27d%20like%20a%20free%20consultation%20about%20plot%20prices%20in%20Pondicherry."
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageSquare className="w-4 h-4" /> Connect on WhatsApp
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PlotPriceInPondicherry;
