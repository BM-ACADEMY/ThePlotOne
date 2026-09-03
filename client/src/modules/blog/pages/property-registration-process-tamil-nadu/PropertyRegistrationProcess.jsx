import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Home, ChevronRight, User, Calendar, MessageSquare, Landmark, FileText } from "lucide-react";

const CANONICAL_URL = "https://theplotone.com/blog/property-registration-process-tamil-nadu";

const PropertyRegistrationProcess = () => {
  useEffect(() => {
    // Scroll to top on mount
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: "instant" });
    }
  }, []);

  return (
    <div className="blog-detail-wrapper">
      <Helmet>
        <title>Property Registration Process in Tamil Nadu – Complete Step-by-Step Guide (2026) | The Plot One</title>
        <meta
          name="description"
          content="Complete step-by-step guide to the property registration process in Tamil Nadu — documents required, Sub-Registrar Office visit, biometric verification, and what to check before signing."
        />
        <link rel="canonical" href={CANONICAL_URL} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={CANONICAL_URL} />
        <meta
          property="og:title"
          content="Property Registration Process in Tamil Nadu – Complete Step-by-Step Guide (2026)"
        />
        <meta
          property="og:description"
          content="Documents required, Sub-Registrar Office visit, biometric verification, and what to check before signing your sale deed in Tamil Nadu."
        />
      </Helmet>

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
          font-size: 0.9rem;
          background: var(--white);
        }
        th, td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid var(--line);
        }
        th {
          background: var(--navy-deep);
          color: var(--white);
          font-weight: 700;
          font-size: 0.72rem;
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

        .side-card.steps h4 {
          color: var(--navy-deep);
          font-size: 1.02rem;
          font-weight: 800;
          margin-bottom: 12px;
        }
        .step-row {
          display: flex;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px dashed var(--line);
          font-size: 0.86rem;
          color: #374151;
        }
        .step-row:last-child {
          border-bottom: none;
        }
        .step-num {
          width: 20px;
          height: 20px;
          background: var(--primary);
          color: var(--white);
          border-radius: 5px;
          font-size: 0.7rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
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
            <span className="text-gray-800 font-semibold truncate">Legal &amp; Registration Guide</span>
          </div>

          <div className="cat-pill">Legal &amp; Registration Guide</div>

          <h1 className="title">
            Property Registration Process in Tamil Nadu — Complete Step-by-Step Guide for Land &amp; Plot Buyers (2026)
          </h1>

          <div className="byline">
            <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-[#166aa8]" /> The Plot One Team</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#166aa8]" /> 17 August 2026</span>
          </div>

          <img
            className="hero-img"
            src="https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=1600&q=80"
            alt="Two people reviewing and signing property documents at a desk"
          />

          <p>
            Buying land is one of life's biggest achievements. Whether you're purchasing your first
            residential plot, investing for the future, or planning to build your dream home, the
            final and most important step is property registration. Many buyers focus on selecting
            the right location but don't fully understand how the registration process works.
          </p>

          <div className="callout">
            <h4>Quick Answer</h4>
            <p>
              The property registration process in Tamil Nadu involves verifying property documents,
              preparing the sale deed, paying applicable stamp duty and registration charges,
              visiting the Sub-Registrar Office (SRO), completing biometric verification, and
              officially registering the property. Whether you're buying a plot near Pondicherry or
              anywhere in Tamil Nadu, proper legal verification before registration is essential.
            </p>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">1</span> Select the Property &amp; Verify Documents
            </h3>
            <img
              src="https://images.unsplash.com/photo-1635548759686-8112623d806e?auto=format&fit=crop&w=1200&q=80"
              alt="Aerial view of open land divided by an approach road"
            />
            <p>
              The journey starts with choosing the right property and inspecting it personally —
              whether in Pondicherry border areas, Villupuram, Cuddalore, Tindivanam, Chennai, or
              elsewhere in Tamil Nadu. Before paying a significant advance, verify the parent
              documents, previous sale deeds, patta, Encumbrance Certificate (EC), layout approval,
              survey records, tax receipts, and the seller's identity. Consult a qualified property
              lawyer if needed.
            </p>
            <div className="cta-pill-wrap">
              <a
                className="cta-pill"
                href="https://wa.me/919403892971?text=Hi%2C%20can%20you%20help%20me%20verify%20documents%20before%20I%20register%20a%20plot%3F"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText className="w-4 h-4" /> Get Document Verification Support
              </a>
            </div>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">2</span> Draft the Sale Deed &amp; Pay Applicable Charges
            </h3>
            <img
              src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80"
              alt="Close-up of hands reviewing documents and paperwork on a desk"
            />
            <p>
              The sale deed is the primary legal document transferring ownership — it includes buyer
              and seller details, property description, survey number, boundaries, consideration
              amount, and terms. Check every detail carefully before signing. Before registration,
              applicable government charges such as stamp duty and registration fees generally need
              to be paid; always confirm the latest rates with the appropriate authority or your
              legal advisor, since rates are subject to change.
            </p>
            <div className="cta-pill-wrap">
              <a
                className="cta-pill"
                href="https://wa.me/919403892971?text=Hi%2C%20can%20you%20explain%20the%20sale%20deed%20and%20charges%20involved%20in%20registration%3F"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText className="w-4 h-4" /> Understand the Sale Deed &amp; Charges
              </a>
            </div>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">3</span> Sub-Registrar Office Visit &amp; Identity Verification
            </h3>
            <img
              src="https://d1di04ifehjy6m.cloudfront.net/media/filer_public/de/66/de663b0a-8a76-4cb1-bf37-7f3fec9fdde6/property_registration_in_bangalore__process_documents__costs.png"
              alt="Housing loan letter blocks on a wooden surface, representing official registration"
            />
            <p>
              The buyer and seller (or their authorized representatives) generally visit the
              jurisdictional Sub-Registrar Office (SRO), where officials verify documents before
              proceeding. The process usually includes identity verification, photograph capture,
              fingerprint (biometric) verification, and signature verification. Once documents are
              verified and accepted, the sale deed is registered — the registered document becomes
              official proof of ownership transfer.
            </p>
            <div className="cta-pill-wrap">
              <a
                className="cta-pill"
                href="https://wa.me/919403892971?text=Hi%2C%20can%20you%20guide%20me%20through%20the%20Sub-Registrar%20Office%20visit%3F"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText className="w-4 h-4" /> Get Guidance for Your SRO Visit
              </a>
            </div>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">4</span> Property Registration Near Pondicherry
            </h3>
            <img
              src="https://images.unsplash.com/photo-1569157087866-f4a8e9250605?auto=format&fit=crop&w=1200&q=80"
              alt="Mustard-yellow colonial house in Pondicherry's French Quarter"
            />
            <p>
              Many buyers purchase plots near Pondicherry in nearby Tamil Nadu locations such as
              Kottakuppam, Kalapet, Villupuram, Cuddalore, and Tindivanam. If the property falls
              within Tamil Nadu, registration generally follows Tamil Nadu procedures; properties
              within the Union Territory of Puducherry follow the procedures applicable there. Always
              confirm jurisdiction before registration.
            </p>
            <div className="cta-pill-wrap">
              <a
                className="cta-pill"
                href="https://wa.me/919403892971?text=Hi%2C%20I%27d%20like%20to%20confirm%20which%20registration%20jurisdiction%20applies%20to%20my%20plot."
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText className="w-4 h-4" /> Confirm Your Registration Jurisdiction
              </a>
            </div>
          </div>

          <h2>Property Registration Process — Quick Comparison</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Stage</th><th>What Happens</th><th>Why It Matters</th></tr>
              </thead>
              <tbody>
                <tr><td>Property Selection</td><td>Choose the right plot</td><td>Ensures the investment matches your needs</td></tr>
                <tr><td>Legal Verification</td><td>Check ownership and documents</td><td>Helps avoid legal disputes</td></tr>
                <tr><td>Sale Deed Preparation</td><td>Draft transfer document</td><td>Defines buyer and seller rights</td></tr>
                <tr><td>Payment of Charges</td><td>Pay applicable government charges</td><td>Required before registration</td></tr>
                <tr><td>Sub-Registrar Visit</td><td>Submit documents, appear in person</td><td>Official verification process</td></tr>
                <tr><td>Biometric Verification</td><td>Identity confirmation</td><td>Prevents impersonation</td></tr>
                <tr><td>Registration</td><td>Sale deed officially registered</td><td>Legal transfer of ownership</td></tr>
                <tr><td>Post-Registration</td><td>Update land records where applicable</td><td>Keeps records current</td></tr>
              </tbody>
            </table>
          </div>

          <div className="who-benefits">
            <h2>Who Benefits From a Smooth Registration Process?</h2>
            <img
              src="https://img.staticmb.com/mbcontent/images/crop/uploads/ver2/XIwvQlc61t8ZIpanz4mAmDUymNPbMqQve38xHEaDnKMz7w/property-registration_0_1200.jpg"
              alt="Team collaborating around a table"
            />
            <p>
              First-time buyers avoid confusion at the Sub-Registrar Office by knowing what to
              expect. Families building a home get a clean, disputed-free title from day one.
              Investors protect their resale value with properly registered documents. And anyone
              applying for a bank loan benefits from registration paperwork that matches exactly what
              lenders expect to see.
            </p>
            <div className="cta-pill-wrap">
              <a
                className="cta-pill"
                href="https://wa.me/919403892971?text=Hi%2C%20I%27d%20like%20help%20preparing%20for%20a%20smooth%20property%20registration."
                target="_blank"
                rel="noopener noreferrer"
              >
                <Landmark className="w-4 h-4" /> Prepare for a Smooth Registration
              </a>
            </div>
          </div>

          <div className="why-choose">
            <h2>Why Choose The Plot One</h2>
            <ul className="why-list">
              <li><b>Registration-Ready Plots</b> — every listed plot comes with documentation prepared for a smooth SRO visit.</li>
              <li><b>Document Support</b> — help assembling parent documents, EC, patta, sale deed, and approval letters.</li>
              <li><b>End-to-End Guidance</b> — from property selection through registration and post-registration formalities.</li>
            </ul>
            <div className="cta-pill-wrap">
              <Link to="/post-requirement" className="cta-pill">
                <FileText className="w-4 h-4" /> Find a Registration-Ready Plot
              </Link>
            </div>
          </div>

          <div className="success-stories">
            <h2>Success Stories</h2>
            <div className="success-card">
              <div className="stars">★★★★★</div>
              <p className="quote">
                "We had no idea what to expect at the Sub-Registrar Office. The Plot One
                prepared every document in advance and walked us through the whole registration day."
              </p>
              <div className="client">
                Vignesh &amp; Priyanka <span>First-time buyers, Cuddalore Road</span>
              </div>
            </div>
          </div>

          <div className="final-cta">
            <h2>Ready to Buy a Verified Plot?</h2>
            <p>
              We help buyers find verified residential plots across Pondicherry, Cuddalore,
              Villupuram, Tindivanam, Chennai, and Tamil Nadu — with transparent guidance from
              property selection to documentation.
            </p>
            <a
              className="final-cta-btn"
              href="https://wa.me/919403892971?text=Hi%2C%20I%27d%20like%20the%20verified%20plot%20list%20with%20registration%20support."
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
              Pondicherry's trusted real estate partner — every plot we list comes registration-ready,
              so your Sub-Registrar Office visit goes smoothly.
            </p>
            <hr className="side-divider" />
            <div className="tags">
              <span className="tag-chip">#PropertyRegistration</span>
              <span className="tag-chip">#TamilNadu</span>
              <span className="tag-chip">#SaleDeed</span>
              <span className="tag-chip">#VerifiedPlots</span>
            </div>
          </div>

          <div className="side-card steps">
            <h4>Registration in Brief</h4>
            <div className="step-row"><span className="step-num">1</span><span>Verify documents &amp; sale deed</span></div>
            <div className="step-row"><span className="step-num">2</span><span>Pay stamp duty &amp; registration charges</span></div>
            <div className="step-row"><span className="step-num">3</span><span>Visit the Sub-Registrar Office</span></div>
            <div className="step-row"><span className="step-num">4</span><span>Complete biometric &amp; identity checks</span></div>
            <div className="step-row"><span className="step-num">5</span><span>Collect your registered documents</span></div>
          </div>

          <div className="side-card consult">
            <h4>Need a Consultation?</h4>
            <p>Not sure what to expect at registration? Ask our team — no obligation.</p>
            <a
              className="wa-btn"
              href="https://wa.me/919403892971?text=Hi%2C%20I%27d%20like%20a%20free%20consultation%20about%20property%20registration%20in%20Tamil%20Nadu."
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

export default PropertyRegistrationProcess;
