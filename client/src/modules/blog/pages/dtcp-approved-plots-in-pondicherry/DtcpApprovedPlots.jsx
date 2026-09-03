import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, ChevronRight, User, Calendar, Send, ClipboardList, MessageSquare, Building, FileText } from "lucide-react";

const DtcpApprovedPlots = () => {
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
          color: var(--ocean);
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
          border-left: 4px solid var(--ocean);
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

        .cta-pill-wrap {
          text-align: center;
          margin-top: 20px;
        }
        .cta-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--whatsapp);
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

        /* WHO BENEFITS */
        .who-benefits {
          margin: 50px 0;
        }
        .who-benefits h2,
        .why-choose h2,
        .success-stories h2 {
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

        /* WHY CHOOSE US */
        .why-choose {
          margin: 50px 0;
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
        .brand-logo {
          width: 44px;
          height: 44px;
          background: var(--amber-text);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--white);
          font-weight: 800;
          font-size: 1.1rem;
          flex-shrink: 0;
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
          background: var(--whatsapp);
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
            <span className="text-gray-800 font-semibold truncate">Real Estate Guide</span>
          </div>

          <div className="cat-pill">REAL ESTATE GUIDE</div>

          <h1 className="title">
            DTCP Approved Plots in Pondicherry – Everything You Need to Know Before Buying
          </h1>

          <div className="byline">
            <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-[#166aa8]" /> The Plot One Team</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#166aa8]" /> 29 July 2026</span>
          </div>

          <img
            className="hero-img"
            src="/blog/dtcp-approved-plots.webp"
            alt="Rock Beach Pondicherry at dawn"
          />

          <p>
            Buying land is one of the biggest financial decisions a family makes. In recent years,
            Pondicherry and nearby areas like Villupuram, Cuddalore, and Tindivanam — along with
            investors from Chennai — have shown growing interest in residential plots, drawn by the
            city's steady development and unhurried pace of life.
          </p>

          <p>
            But before any money changes hands, one question decides whether that investment turns out
            well: <strong>is the plot DTCP approved?</strong> Buyers who skip this question often
            run into legal disputes, loan rejections, or a resale that just won't move.
          </p>

          <div className="callout">
            <h4>Why DTCP Approval Matters</h4>
            <p>
              A DTCP-approved layout means the government's planning authority has verified the road
              width, drainage, land classification, and public spaces of that project — so your
              future home is legally sound, bank-loan friendly, and easy to resell.
            </p>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">1</span> What Is DTCP Approval?
            </h3>
            <img
              src="/blog/dtcp-approved-plots.webp"
              alt="Aerial view of a planned residential layout in Pondicherry"
            />
            <p>
              DTCP stands for the Directorate of Town and Country Planning — the government
              authority that approves residential layouts after verifying road width, drainage, land
              classification, and public infrastructure. A DTCP number on your documents means the
              layout is legally planned for residential use.
            </p>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">2</span> Why Pondicherry Is a Growing Hotspot
            </h3>
            <img
              src="https://images.unsplash.com/photo-1569157087866-f4a8e9250605?auto=format&fit=crop&w=1200&q=80"
              alt="Mustard-yellow colonial house in Pondicherry's French Quarter"
            />
            <p>
              Growing infrastructure, a peaceful lifestyle, rising tourism, and easy Chennai
              connectivity have made Pondicherry one of South India's most attractive investment
              destinations. Areas like Kottakuppam, Lawspet, and the JIPMER surroundings are seeing
              steady demand.
            </p>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">3</span> Documents You Must Verify
            </h3>
            <img
              src="/blog/land-registration-docs.webp"
              alt="Close-up of hands reviewing property documents and paperwork on a desk"
            />
            <p>
              Never buy on the strength of an advertisement alone. Always check the parent
              documents, DTCP approval number, patta, and Encumbrance Certificate (EC) before making
              any payment — and get a lawyer or trusted advisor to review everything.
            </p>
            {/* CTA 1: Browse Properties Navigation */}
            <div className="cta-pill-wrap">
              <Link to="/properties" className="cta-pill">
                <Building className="w-4 h-4" /> Browse DTCP Approved Plots
              </Link>
            </div>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">4</span> Common Mistakes to Avoid
            </h3>
            <img
              src="https://images.unsplash.com/photo-1635548759686-8112623d806e?auto=format&fit=crop&w=1200&q=80"
              alt="Aerial view of land divided by an approach road"
            />
            <p>
              Many buyers lose money by skipping legal verification, trusting only verbal promises,
              or buying simply because the price looks low. A clear approach road and a visible
              DTCP number are non-negotiable — a cheap plot today can become an expensive mistake
              tomorrow.
            </p>
          </div>

          <div className="who-benefits">
            <h2>Who Benefits From DTCP Approved Plots?</h2>
            <img
              src="/blog/pondicherry-growth.webp"
              alt="Team collaborating around a table"
            />
            <p>
              Working professionals, NRIs, first-time buyers, investors, and families all benefit
              from choosing DTCP-approved land — it means lower legal risk, easier bank financing, and
              a smoother path to building a home or growing an investment.
            </p>
          </div>

          <div className="why-choose">
            <h2>Why Choose The Plot One</h2>
            <ul className="why-list">
              <li>
                <b>Proven Results</b> — 500+ families guided to verified, legally clean plots across
                Pondicherry.
              </li>
              <li>
                <b>Affordable Packages</b> — transparent pricing with no hidden costs, across every
                budget range.
              </li>
              <li>
                <b>End-to-End Support</b> — from document verification and site visits through to
                registration.
              </li>
            </ul>
            {/* CTA 2: Post Requirement Navigation */}
            <div className="cta-pill-wrap">
              <Link to="/post-requirement" className="cta-pill">
                <FileText className="w-4 h-4" /> Post Your Land Requirement
              </Link>
            </div>
          </div>

          <div className="success-stories">
            <h2>Success Stories</h2>
            <div className="success-card">
              <div className="stars">★★★★★</div>
              <p className="quote">
                "We were first-time buyers and had no idea what to check. The Plot One
                walked us through every document and got us a DTCP-approved plot near Lawspet
                within our budget."
              </p>
              <div className="client">
                Karthik &amp; Divya <span>Homeowners, Lawspet</span>
              </div>
            </div>
          </div>

          <div className="final-cta">
            <h2>Ready to Find Your Verified Plot?</h2>
            <p>
              Get our latest DTCP-approved plot list and book a free site visit across
              Pondicherry, Kottakuppam, Villupuram, Cuddalore, and Tindivanam.
            </p>
            <a
              className="final-cta-btn"
              href="https://wa.me/919403892971?text=Hi%2C%20I%27d%20like%20the%20verified%20DTCP%20approved%20plot%20list%20for%20Pondicherry."
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
              Pondicherry's trusted real estate partner, helping families find verified, DTCP-approved
              plots with complete transparency — from enquiry to registration.
            </p>
            <hr className="side-divider" />
            <div className="tags">
              <span className="tag-chip">#Pondicherry</span>
              <span className="tag-chip">#DTCPApproved</span>
              <span className="tag-chip">#VerifiedPlots</span>
              <span className="tag-chip">#RealEstate</span>
            </div>
          </div>

          <div className="side-card consult">
            <h4>Need a Consultation?</h4>
            <p>Talk to our team about verified plots, pricing, and site visits — no obligation.</p>
            <a
              className="wa-btn"
              href="https://wa.me/919403892971?text=Hi%2C%20I%27d%20like%20a%20free%20consultation%20about%20DTCP%20approved%20plots%20in%20Pondicherry."
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

export default DtcpApprovedPlots;
