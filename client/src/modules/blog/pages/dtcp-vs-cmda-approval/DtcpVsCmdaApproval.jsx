import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, ChevronRight, User, Calendar, Send, ClipboardList, MessageSquare, Building, FileText } from "lucide-react";

const DtcpVsCmdaApproval = () => {
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

        /* TABLE */
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
          font-size: 0.9rem;
          background: var(--white);
        }
        th, td {
          padding: 12px 14px;
          text-align: left;
          border-bottom: 1px solid var(--line);
        }
        th {
          background: var(--navy-deep);
          color: var(--white);
          font-weight: 700;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        tr:nth-child(even) {
          background: #FAFBFC;
        }
        .tag-yes {
          color: var(--primary);
          font-weight: 700;
        }
        .tag-no {
          color: var(--coral);
          font-weight: 700;
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

        .side-card.quickref h4 {
          color: var(--navy-deep);
          font-size: 1.02rem;
          font-weight: 800;
          margin-bottom: 12px;
        }
        .qr-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 9px 0;
          border-bottom: 1px dashed var(--line);
          font-size: 0.85rem;
          gap: 8px;
        }
        .qr-row:last-child {
          border-bottom: none;
        }
        .qr-row span:first-child {
          color: #374151;
          font-weight: 700;
          white-space: nowrap;
        }
        .qr-row span:last-child {
          color: var(--gray);
          text-align: right;
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
            <span className="text-gray-800 font-semibold truncate">Legal &amp; Approval Guide</span>
          </div>

          <div className="cat-pill">Legal &amp; Approval Guide</div>

          <h1 className="title">DTCP vs CMDA Approval — Which One Should You Choose?</h1>

          <div className="byline">
            <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-[#166aa8]" /> The Plot One Team</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#166aa8]" /> 3 August 2026</span>
          </div>

          <img
            className="hero-img"
            src="/blog/land-registration-docs.webp"
            alt="Close-up of hands reviewing property approval documents and paperwork"
          />

          <p>
            Buying a plot is one of the biggest financial decisions in life. Whether you're purchasing land to build
            your dream home or investing for future appreciation, legal approval is the first thing you should verify.
          </p>

          <p>
            Many buyers get confused between <strong>DTCP</strong>, <strong>CMDA</strong>, and <strong>RERA</strong>.
            They ask: is DTCP approval enough? Is CMDA better? Does RERA replace either of them? This guide explains
            everything in simple English, with examples from Pondicherry and Tamil Nadu.
          </p>

          <div className="callout">
            <h4>Why Property Approval Matters</h4>
            <p>
              Buy an unapproved plot and you may later find you can't get a building plan cleared, banks reject your
              loan, authorities issue notices, and resale becomes difficult. A legally approved property gives you peace of
              mind, smoother documentation, and higher buyer confidence.
            </p>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">1</span> What Is DTCP Approval?
            </h3>
            <img
              src="/blog/dtcp-approved-plots.webp"
              alt="Aerial view of land divided by an approach road in a developing town area"
            />
            <p>
              DTCP stands for the <strong>Directorate of Town and Country Planning</strong> — the authority responsible for
              approving layouts across most of Tamil Nadu, outside the Chennai Metropolitan Area. It checks that roads are
              properly planned, open spaces are allocated, and the layout follows government planning rules. Areas commonly
              requiring DTCP approval include Pondicherry border areas, Villupuram, Cuddalore, Tindivanam, Salem, Madurai,
              Coimbatore, and many developing towns.
            </p>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">2</span> What Is CMDA Approval?
            </h3>
            <img
              src="/blog/pondicherry-growth.webp"
              alt="Aerial view of a busy Chennai metropolitan city area"
            />
            <p>
              CMDA stands for the <strong>Chennai Metropolitan Development Authority</strong> — responsible for planning and
              approving layouts within the Chennai Metropolitan Area, covering residential, commercial, and apartment
              developments. It may cover parts of Chennai, Tambaram, Avadi, and Chengalpattu. Since metropolitan boundaries can
              shift, always verify whether a property actually falls within CMDA jurisdiction before assuming DTCP applies.
            </p>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">3</span> DTCP vs CMDA vs RERA — Comparison
            </h3>
            <img
              src="https://images.unsplash.com/photo-1597073642928-48c0971f7ded?auto=format&fit=crop&w=1200&q=80"
              alt="Aerial view of a well-planned Pondicherry residential area near the water"
            />
            <p>
              RERA (Real Estate Regulatory Authority) is often mistaken for a third planning approval — it isn't. DTCP and
              CMDA are <strong>planning</strong> approvals; RERA is a <strong>regulatory</strong> framework protecting buyers and
              improving developer transparency. A project can need both a planning approval and RERA registration, depending
              on its size and nature.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Feature</th><th>DTCP</th><th>CMDA</th><th>RERA</th></tr>
                </thead>
                <tbody>
                  <tr><td>Purpose</td><td>Layout approval</td><td>Metropolitan planning approval</td><td>Buyer protection &amp; project regulation</td></tr>
                  <tr><td>Applicable Area</td><td>Most of Tamil Nadu outside Chennai</td><td>Chennai Metropolitan Area</td><td>Eligible real estate projects</td></tr>
                  <tr><td>Approves Layouts</td><td className="tag-yes">Yes</td><td className="tag-yes">Yes</td><td className="tag-no">No</td></tr>
                  <tr><td>Regulates Developers</td><td className="tag-no">No</td><td className="tag-no">No</td><td className="tag-yes">Yes</td></tr>
                  <tr><td>Buyer Protection</td><td>Limited</td><td>Limited</td><td className="tag-yes">Yes</td></tr>
                  <tr><td>Focus</td><td>Land planning</td><td>Urban planning</td><td>Real estate regulation</td></tr>
                </tbody>
              </table>
            </div>
            <p>
              Neither approval is "better" — the correct one depends entirely on the property's location. A plot in
              Villupuram should generally carry DTCP approval; a plot within Chennai Metropolitan limits should generally carry
              CMDA approval.
            </p>
            {/* CTA 1: Browse Properties Navigation */}
            <div className="cta-pill-wrap">
              <Link to="/properties" className="cta-pill">
                <Building className="w-4 h-4" /> Browse Approved Properties
              </Link>
            </div>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">4</span> Buying Near Pondicherry — Which Approval Applies?
            </h3>
            <img
              src="https://images.unsplash.com/photo-1569157087866-f4a8e9250605?auto=format&fit=crop&w=1200&q=80"
              alt="Mustard-yellow colonial house in Pondicherry's French Quarter"
            />
            <p>
              Many Chennai buyers invest around Pondicherry for its affordability, growing infrastructure, and peaceful
              surroundings — in areas like Kottakuppam, Kalapet, Madagadipet, Villianur, Thavalakuppam, Cuddalore Road,
              Villupuram Road, and Tindivanam Road. Some of these fall under Puducherry administration, while nearby Tamil
              Nadu locations may require DTCP approval instead. Always verify the applicable authority before making a
              purchase — never assume based on the seller's word alone.
            </p>
          </div>

          <div className="who-benefits">
            <h2>Who Benefits From Knowing DTCP vs CMDA?</h2>
            <img
              src="/blog/pondicherry-growth.webp"
              alt="Team collaborating around a table"
            />
            <p>
              First-time buyers avoid costly surprises after purchase. Chennai investors avoid assuming DTCP applies to a
              CMDA-zoned property (or vice versa). Families building a home get smoother building-plan approvals. And anyone
              applying for a bank loan benefits from documentation that's correctly matched to the right authority from day one.
            </p>
          </div>

          <div className="why-choose">
            <h2>Why Choose The Plot One</h2>
            <ul className="why-list">
              <li>
                <b>Verified Approvals</b> — every plot we list has its DTCP or applicable approval checked and confirmed.
              </li>
              <li>
                <b>Document Support</b> — help verifying parent documents, patta, EC, survey sketch, and approval letters.
              </li>
              <li>
                <b>End-to-End Guidance</b> — from jurisdiction verification through registration, so you never guess which authority applies.
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
                "We almost bought a plot the seller called 'DTCP approved' — turns out it needed CMDA approval instead.
                The Plot One caught it before we paid the advance."
              </p>
              <div className="client">
                Ravi &amp; Meena <span>Buyers, Villupuram border</span>
              </div>
            </div>
          </div>

          <div className="final-cta">
            <h2>Ready to Buy a Verified Plot?</h2>
            <p>
              Looking for verified residential plots around Pondicherry, Villupuram, Cuddalore, Tindivanam, or Chennai?
              Get our verified plot list and buy with confidence.
            </p>
            <a
              className="final-cta-btn"
              href="https://wa.me/919403892971?text=Hi%2C%20I%27d%20like%20the%20verified%20plot%20list%20with%20confirmed%20DTCP%2FCMDA%20approvals."
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
              Pondicherry's trusted real estate partner — every plot we list has its planning approval verified against the
              correct authority before it reaches you.
            </p>
            <hr className="side-divider" />
            <div className="tags">
              <span className="tag-chip">#DTCP</span>
              <span className="tag-chip">#CMDA</span>
              <span className="tag-chip">#RERA</span>
              <span className="tag-chip">#LegalVerification</span>
            </div>
          </div>

          <div className="side-card quickref">
            <h4>Quick Reference</h4>
            <div className="qr-row"><span>DTCP</span><span>Outside Chennai Metro — Pondicherry border, Villupuram, Cuddalore</span></div>
            <div className="qr-row"><span>CMDA</span><span>Within Chennai Metro — Chennai, Tambaram, Avadi</span></div>
            <div className="qr-row"><span>RERA</span><span>Regulates developers &amp; protects buyers, doesn't replace DTCP/CMDA</span></div>
          </div>

          <div className="side-card consult">
            <h4>Need a Consultation?</h4>
            <p>Not sure whether your plot needs DTCP or CMDA approval? Ask our team — no obligation.</p>
            <a
              className="wa-btn"
              href="https://wa.me/919403892971?text=Hi%2C%20I%27d%20like%20a%20free%20consultation%20on%20DTCP%20vs%20CMDA%20approval%20for%20my%20plot."
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

export default DtcpVsCmdaApproval;
