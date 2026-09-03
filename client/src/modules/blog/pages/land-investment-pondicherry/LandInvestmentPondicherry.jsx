import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, ChevronRight, User, Calendar, MessageSquare, MapPin, FileText } from "lucide-react";

const LandInvestmentPondicherry = () => {
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

        .side-card.quickref h4 {
          color: var(--navy-deep);
          font-size: 1.02rem;
          font-weight: 800;
          margin-bottom: 12px;
        }
        .qr-row {
          padding: 9px 0;
          border-bottom: 1px dashed var(--line);
          font-size: 0.86rem;
        }
        .qr-row:last-child {
          border-bottom: none;
        }
        .qr-row b {
          color: var(--navy-deep);
        }
        .qr-row span {
          color: var(--gray);
          display: block;
          margin-top: 2px;
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
            <span className="text-gray-800 font-semibold truncate">Investment Guide</span>
          </div>

          <div className="cat-pill">Investment Guide</div>

          <h1 className="title">
            Is Land Investment in Pondicherry Worth It? A Complete Guide for Smart Property Buyers
          </h1>

          <div className="byline">
            <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-[#166aa8]" /> The Plot One Team</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#166aa8]" /> 6 August 2026</span>
          </div>

          <img
            className="hero-img"
            src="https://images.travelandleisureasia.com/wp-content/uploads/sites/3/2024/11/25152004/rue-francois-martin-street.jpeg"
            alt="Rock Beach Pondicherry at dawn"
          />

          <p>
            Buying land has always been one of the most trusted forms of investment in India. Unlike apartments, land
            requires minimal maintenance and offers flexibility for future use. If you're considering land investment
            in Pondicherry, you're probably asking: is it a good place to invest, will prices rise, and is land better
            than an apartment?
          </p>

          <div className="callout">
            <h4>Quick Answer</h4>
            <p>
              Yes — land investment in Pondicherry can be a good long-term option for buyers who choose the right
              location, verify legal documents, and invest with clear goals. The region attracts homebuyers, retirees,
              weekend-home seekers, and investors thanks to its connectivity, lifestyle, and steady infrastructure
              development. Always verify approvals and documents before purchasing.
            </p>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">1</span> Why Land Is Often Preferred Over Apartments
            </h3>
            <img
              src="https://d1di04ifehjy6m.cloudfront.net/media/filer_public/ed/a1/eda1ca5b-5970-4c41-b4dd-c755f529349c/is_land_still_the_best_investment_in_2026.png"
              alt="Aerial view of open land divided by an approach road"
            />
            <p>
              Land gives you flexibility — build a home when you're ready, without being bound by apartment
              association rules. It usually needs lower maintenance, with no monthly association charges in many
              cases. And unlike buildings, land doesn't depreciate with age; its value depends largely on location
              and development. Buy today for investment, and tomorrow you can build a home, add rental units, sell
              at the right time, or pass it on to the next generation.
            </p>
            <div className="cta-pill-wrap">
              <a
                className="cta-pill"
                href="https://wa.me/919403892971?text=Hi%2C%20I%27d%20like%20to%20know%20more%20about%20land%20investment%20options%20in%20Pondicherry."
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin className="w-4 h-4" /> Explore Land Investment Options
              </a>
            </div>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">2</span> Why Pondicherry Is Attracting Investors
            </h3>
            <img
              src="https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/17/01/8b/a8.jpg"
              alt="Aerial view of a Pondicherry highway lined with palm trees"
            />
            <p>
              Excellent connectivity via ECR to Chennai, Villupuram, Cuddalore, Tindivanam, and Mahabalipuram makes
              weekend travel easy. Reputed institutions like Pondicherry University, JIPMER, and Pondicherry
              Engineering College create steady rental demand from students. Add strong tourism appeal — beaches,
              cafés, heritage streets, spiritual centres — plus a cleaner, less crowded lifestyle than most metro
              cities, and it's easy to see why investors keep coming back.
            </p>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">3</span> Popular Areas for Land Investment
            </h3>
            <img
              src="https://images.unsplash.com/photo-1569157087866-f4a8e9250605?auto=format&fit=crop&w=1200&q=80"
              alt="Mustard-yellow colonial house in Pondicherry's French Quarter"
            />
            <p>
              The "best" location depends on your goal. <strong>Kottakuppam</strong>, near the Tamil Nadu–Puducherry
              border, suits residential buyers and rental investors. <strong>Kalapet</strong> draws professionals near
              educational institutions and the ECR. <strong>Villianur</strong> is popular for independent homes, while
              <strong> Madagadipet</strong> offers developing opportunities. <strong>Cuddalore Road</strong>,
              <strong> Villupuram side</strong>, and the <strong>Tindivanam route</strong> all attract buyers seeking
              relatively affordable land with growing connectivity. Always verify legal status before investing in
              any of these.
            </p>
            <div className="cta-pill-wrap">
              <Link to="/properties" className="cta-pill">
                <MapPin className="w-4 h-4" /> Find the Right Area for Your Goal
              </Link>
            </div>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">4</span> Factors to Consider Before Investing
            </h3>
            <img
              src="/blog/land-registration-docs.webp"
              alt="Close-up of hands reviewing property documents and paperwork on a desk"
            />
            <p>
              Beyond location, verify the parent documents, sale deed, patta, EC, survey records, and layout approval
              — never assume approval based on advertisements. Check road access, groundwater or borewell
              feasibility, and electricity availability if you plan to build. And look at surrounding development:
              schools, hospitals, shops, bus routes, and existing homes all signal a neighbourhood that will keep
              attracting buyers over time.
            </p>
          </div>

          <h2>Pondicherry vs Nearby Tamil Nadu Areas</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Factor</th><th>Pondicherry</th><th>Nearby TN (Villupuram, Cuddalore, Tindivanam)</th></tr>
              </thead>
              <tbody>
                <tr><td>Lifestyle</td><td>Peaceful urban environment</td><td>Mix of town and developing residential areas</td></tr>
                <tr><td>Connectivity</td><td>Excellent</td><td>Good highway connectivity</td></tr>
                <tr><td>Residential Demand</td><td>Strong</td><td>Growing in selected areas</td></tr>
                <tr><td>Investment Purpose</td><td>Home, retirement, rental</td><td>Long-term investment, residential development</td></tr>
                <tr><td>Plot Availability</td><td>Depends on location</td><td>Wider options in many developing areas</td></tr>
                <tr><td>Legal Verification</td><td>Essential</td><td>Essential</td></tr>
              </tbody>
            </table>
          </div>
          <p>There's no single "best" option — the right choice depends on your budget, investment timeline, and future plans.</p>

          <div className="who-benefits">
            <h2>Who Benefits Most From Land Investment Here?</h2>
            <img
              src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgaWfz5Z_ax_y-DmDQjcpdZwAn8Eebmzg7i57tAS5JVkzHNAMREWy0tQDiWcUd7xjCgqpV1B-HKOq5wu-y32x5qPau8BbkBjAvRUntkBzP90ZyeYZcUIbehGjtxU03Zvw53jLm9tZob3FTU/s1600/PondicherryBeachRoad.JPG"
              alt="Man and woman sitting together on a bench"
            />
            <p>
              <strong>Long-term investors</strong> gain from developing areas with good connectivity and legal
              clarity. <strong>Home builders</strong> benefit from locations near schools, hospitals, and workplaces.
              <strong> Weekend home buyers</strong> from Chennai enjoy peaceful surroundings with easy highway access.
              And <strong>retirees</strong> find Pondicherry's calm lifestyle ideal for settling down.
            </p>
          </div>

          <div className="why-choose">
            <h2>Why Choose The Plot One</h2>
            <ul className="why-list">
              <li>
                <b>Verified Land</b> — every plot checked for documentation and approval status before it's listed.
              </li>
              <li>
                <b>Goal-Based Guidance</b> — whether you're a long-term investor, home builder, or retiree, we match
                you to the right area.
              </li>
              <li>
                <b>End-to-End Support</b> — document verification, site visits, and investment guidance from enquiry
                to registration.
              </li>
            </ul>
            <div className="cta-pill-wrap">
              <Link to="/post-requirement" className="cta-pill">
                <FileText className="w-4 h-4" /> Start Your Investment Journey
              </Link>
            </div>
          </div>

          <div className="success-stories">
            <h2>Success Stories</h2>
            <div className="success-card">
              <div className="stars">★★★★★</div>
              <p className="quote">
                "We wanted a weekend home near Pondicherry without the Chennai price tag. The Plot One
                found us a verified plot in Kottakuppam with clean documents and easy road access."
              </p>
              <div className="client">
                Suresh &amp; Anitha <span>Weekend home buyers, Kottakuppam</span>
              </div>
            </div>
          </div>

          <div className="final-cta">
            <h2>Ready to Explore Verified Plots?</h2>
            <p>
              We help buyers discover verified residential plots across Pondicherry, Cuddalore, Villupuram,
              Tindivanam, Chennai, and other parts of Tamil Nadu — with transparent guidance throughout.
            </p>
            <a
              className="final-cta-btn"
              href="https://wa.me/919403892971?text=Hi%2C%20I%27d%20like%20the%20verified%20plot%20list%20for%20land%20investment%20in%20Pondicherry."
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileText className="w-5 h-5 mr-1" /> Get the Verified Plot-List
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
              Pondicherry's trusted real estate partner, matching buyers — investors, home builders, retirees,
              weekend-home seekers — to the right verified plot.
            </p>
            <hr className="side-divider" />
            <div className="tags">
              <span className="tag-chip">#LandInvestment</span>
              <span className="tag-chip">#Pondicherry</span>
              <span className="tag-chip">#RetirementHome</span>
              <span className="tag-chip">#VerifiedPlots</span>
            </div>
          </div>

          <div className="side-card quickref">
            <h4>Who Should Consider Land Here?</h4>
            <div className="qr-row"><b>Long-Term Investors</b><span>Developing areas, good connectivity</span></div>
            <div className="qr-row"><b>Home Builders</b><span>Near schools, hospitals, workplaces</span></div>
            <div className="qr-row"><b>Weekend Home Buyers</b><span>Peaceful, easy highway access</span></div>
            <div className="qr-row"><b>Retirees</b><span>Calm lifestyle, healthcare access</span></div>
          </div>

          <div className="side-card consult">
            <h4>Need a Consultation?</h4>
            <p>Not sure which area or purpose fits you best? Ask our team — no obligation.</p>
            <a
              className="wa-btn"
              href="https://wa.me/919403892971?text=Hi%2C%20I%27d%20like%20a%20free%20consultation%20about%20land%20investment%20in%20Pondicherry."
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

export default LandInvestmentPondicherry;
