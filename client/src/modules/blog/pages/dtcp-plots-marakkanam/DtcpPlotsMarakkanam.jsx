import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Home, ChevronRight, User, Calendar, ClipboardList, MessageSquare, Building, FileText } from "lucide-react";

const CANONICAL_URL = "https://theplotone.com/blog/dtcp-plots-marakkanam";

const DtcpPlotsMarakkanam = () => {
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
        <title>DTCP Plots in Marakkanam (2026) – Complete Buyer's Guide | The Plot One</title>
        <meta
          name="description"
          content="Planning to invest in land near Pondicherry or Chennai? Complete guide to DTCP-approved plots in Marakkanam — location advantages, documents to verify, and buyer tips."
        />
        <link rel="canonical" href={CANONICAL_URL} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={CANONICAL_URL} />
        <meta
          property="og:title"
          content="DTCP Plots in Marakkanam (2026) – Complete Buyer's Guide"
        />
        <meta
          property="og:description"
          content="Complete buyer's guide to DTCP-approved plots in Marakkanam — location advantages, documents to verify, and smart land investment tips."
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

        .usecase-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin: 20px 0;
        }
        .usecase-card {
          background: #F3F6F9;
          border-radius: 12px;
          padding: 18px 20px;
        }
        .usecase-card h3 {
          font-size: 1rem;
          color: var(--primary);
          margin-bottom: 8px;
          font-weight: 800;
        }
        .usecase-card p,
        .usecase-card ul {
          margin: 0;
          color: #374151;
          font-size: 0.92rem;
        }
        .usecase-card ul {
          padding-left: 18px;
        }

        .cta-strip {
          background: var(--blue-fill);
          border-radius: 16px;
          padding: 22px 26px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          margin: 32px 0;
        }
        .cta-strip p {
          margin: 0;
          font-weight: 700;
          color: var(--navy-deep);
        }
        .btn-solid {
          background: var(--coral);
          color: var(--white) !important;
          font-weight: 700;
          padding: 12px 26px;
          border-radius: 100px;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .btn-solid:hover {
          background: var(--coral-hover) !important;
          transform: translateY(-2px);
        }

        .compare-table-wrap {
          overflow-x: auto;
          margin: 20px 0;
        }
        table.compare-table {
          width: 100%;
          border-collapse: collapse;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 4px 18px rgba(13,27,42,0.08);
          min-width: 560px;
        }
        table.compare-table thead tr {
          background: linear-gradient(135deg, var(--navy-deep) 0%, var(--navy) 100%);
          color: var(--white);
        }
        table.compare-table th,
        table.compare-table td {
          padding: 14px 16px;
          text-align: left;
          font-size: 0.9rem;
        }
        table.compare-table tbody tr:nth-child(even) { background: #F3F6F9; }
        table.compare-table tbody tr:nth-child(odd) { background: var(--white); }

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

        .who-benefits h2,
        .success-stories h2,
        .subsection-plain h2 {
          font-size: 1.7rem;
          color: var(--navy-deep);
          font-weight: 800;
          margin-bottom: 16px;
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

        .faq-item {
          margin-bottom: 20px;
        }
        .faq-item h3 {
          font-size: 1.05rem;
          color: var(--primary);
          margin-bottom: 6px;
          font-weight: 800;
        }
        .faq-item p {
          margin: 0;
          color: #374151;
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
        .checklist {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .checklist li {
          padding: 8px 0;
          border-bottom: 1px dashed var(--line);
          font-size: 0.9rem;
          display: flex;
          gap: 8px;
        }
        .checklist li:last-child {
          border-bottom: none;
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
          .usecase-grid {
            grid-template-columns: 1fr;
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
            <span className="text-gray-800 font-semibold truncate">DTCP Plots &bull; Marakkanam</span>
          </div>

          <div className="cat-pill">DTCP Plots &bull; Marakkanam</div>

          <h1 className="title">
            DTCP Plots in Marakkanam — Complete Buyer's Guide for Smart Land Investment (2026)
          </h1>

          <div className="byline">
            <span><User className="w-4 h-4 text-[#166aa8]" /> The Plot One Team</span>
            <span><Calendar className="w-4 h-4 text-[#166aa8]" /> 13 August 2026</span>
          </div>

          <img
            className="hero-img"
            src="/blog/marakkanam.webp"
            alt="East Coast Road near Marakkanam coastal town"
          />

          <p>
            If you're planning to invest in land near Pondicherry or Chennai, you've probably come
            across Marakkanam as a recommended location. Over the past few years, many homebuyers
            and investors have started exploring this coastal town because of its connectivity,
            peaceful surroundings, and future growth potential.
          </p>
          <p>
            Whether you're buying your first residential plot, planning to build your dream home,
            or looking for a long-term investment, choosing a DTCP-approved plot in Marakkanam can
            offer greater confidence when backed by proper legal verification.
          </p>

          <div className="callout">
            <h4>Quick Answer</h4>
            <p>
              Marakkanam is becoming a popular destination for residential and long-term land
              investment because of its strategic location between Chennai and Pondicherry, good
              road connectivity, and growing development. Before purchasing, always verify DTCP
              approval, ownership documents, and the property's legal status to make a safe
              investment.
            </p>
          </div>

          <div className="subsection-plain">
            <h2>Why Marakkanam Is Becoming a Popular Investment Destination</h2>
            <p>
              Marakkanam is a coastal town in Villupuram district, Tamil Nadu, located along the
              scenic East Coast Road (ECR) between Chennai and Pondicherry. Its location makes it
              attractive for both residential buyers and investors — offering easy connectivity to
              Pondicherry, direct access to Chennai through ECR, peaceful coastal surroundings, and
              growing residential developments. Many people who work in Chennai or Pondicherry also
              look at Marakkanam as a location for weekend homes or future retirement plans.
            </p>
          </div>

          <div className="subsection-plain">
            <h2>What Is a DTCP Plot?</h2>
            <p>
              A DTCP plot is a plot that forms part of a layout approved by the Directorate of Town
              and Country Planning (DTCP), where applicable. DTCP approval helps ensure that the
              layout follows planning norms related to road planning, open spaces, public utility
              areas, and layout planning regulations. It's important to understand that DTCP
              approval relates to the layout — buyers should still independently verify ownership,
              title, and all other legal documents before purchasing.
            </p>
          </div>

          <div className="subsection-plain">
            <h2>Why Choose DTCP Plots in Marakkanam?</h2>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">1</span> Better Planning
            </h3>
            <img
              src="https://img.magnific.com/premium-photo/indian-businesswoman-leading-team-meeting-modern-corporate-office_1442126-411.jpg?semt=ais_hybrid&w=740&q=80"
              alt="Planned residential layout with roads"
            />
            <p>
              Approved layouts generally include planned roads and designated common spaces
              according to applicable planning norms, giving buyers a clearer picture of how the
              neighbourhood will develop.
            </p>
            <div className="cta-pill-wrap">
              <a
                className="cta-pill"
                href="https://wa.me/919403892971?text=Hi%2C%20I%27d%20like%20to%20know%20about%20DTCP-approved%20layouts%20in%20Marakkanam."
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageSquare className="w-4 h-4" /> Ask About Approved Layouts
              </a>
            </div>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">2</span> Easier Documentation
            </h3>
            <img
              src="https://media.istockphoto.com/id/1480777768/photo/businesswoman-hands-working-in-stacks-of-paper-files-for-searching-and-checking-unfinished.jpg?s=612x612&w=0&k=20&c=AIbDXxv79E2aDAoMJ3h69Lwm1OmIKL1Wz3gJFpAexTQ="
              alt="Reviewing property documents"
            />
            <p>
              Properties with proper documentation often make the buying process smoother, although
              every buyer should still complete independent legal verification before proceeding.
            </p>
            <div className="cta-pill-wrap">
              <a
                className="cta-pill"
                href="https://wa.me/919403892971?text=Hi%2C%20I%27d%20like%20help%20reviewing%20documentation%20for%20a%20Marakkanam%20plot."
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageSquare className="w-4 h-4" /> Ask About Documentation
              </a>
            </div>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">3</span> Long-Term Investment
            </h3>
            <img
              src="https://www.sunteckindia.com/blog/isystem/wp-content/uploads/2024/01/Investing-in-Tomorrow.webp"
              alt="Open plot of land near the coast"
            />
            <p>
              Many investors prefer approved residential layouts for future resale or home
              construction, viewing Marakkanam's growth trajectory as a reason to hold land for the
              long term.
            </p>
            {/* CTA: Browse Properties Navigation */}
            <div className="cta-pill-wrap">
              <Link to="/properties" className="cta-pill">
                <Building className="w-4 h-4" /> Browse Investment Plots
              </Link>
            </div>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">4</span> Peace of Mind
            </h3>
            <img
              src="https://d3cnqzq0ivprch.cloudfront.net/public-site/freeprod/assets/images/profile/cover-image/real-estate/real-estate-agents.png"
              alt="Family reviewing a property purchase together"
            />
            <p>
              Choosing a plot with verified approvals and clear documents helps reduce unnecessary
              risks, so you can move forward with greater confidence.
            </p>
          </div>

          <div className="who-benefits">
            <h2>Location Advantages of Marakkanam</h2>
            <div className="usecase-grid">
              <div className="usecase-card">
                <h3>Close to Pondicherry</h3>
                <p>Marakkanam is within convenient driving distance of Pondicherry, making it attractive for families and professionals.</p>
              </div>
              <div className="usecase-card">
                <h3>Excellent ECR Connectivity</h3>
                <ul>
                  <li>Chennai</li>
                  <li>Mahabalipuram</li>
                  <li>Kalpakkam</li>
                  <li>Pondicherry</li>
                </ul>
              </div>
              <div className="usecase-card">
                <h3>Nearby Tourist Attractions</h3>
                <ul>
                  <li>Pondicherry</li>
                  <li>Auroville</li>
                  <li>Paradise Beach</li>
                </ul>
              </div>
              <div className="usecase-card">
                <h3>Nearby Attractions (contd.)</h3>
                <ul>
                  <li>Mahabalipuram</li>
                  <li>Alamparai Fort</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="who-benefits">
            <h2>Who Should Buy Plots in Marakkanam?</h2>
            <div className="usecase-grid">
              <div className="usecase-card">
                <h3>First-Time Home Buyers</h3>
                <p>If you plan to build your own house in the future, Marakkanam offers a peaceful environment with good connectivity.</p>
              </div>
              <div className="usecase-card">
                <h3>Long-Term Investors</h3>
                <p>Buyers looking to hold land for several years often explore developing locations like Marakkanam.</p>
              </div>
              <div className="usecase-card">
                <h3>Retirement Planning</h3>
                <p>Many families prefer quieter coastal areas for retirement living.</p>
              </div>
              <div className="usecase-card">
                <h3>Weekend Home Buyers</h3>
                <p>People from Chennai and Pondicherry sometimes look for land near the coast to build holiday homes.</p>
              </div>
            </div>
          </div>

          <div className="cta-strip">
            <p>Want a shortlist of verified DTCP plots in Marakkanam?</p>
            <a
              className="btn-solid"
              href="https://wa.me/919403892971?text=Hi%2C%20please%20send%20me%20the%20Verified%20Plot-List%20PDF%20for%20Marakkanam."
              target="_blank"
              rel="noopener noreferrer"
            >
              Get the Verified Plot-List
            </a>
          </div>

          <div className="subsection-plain">
            <h2>DTCP Plot vs Non-Approved Plot</h2>
            <div className="compare-table-wrap">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>DTCP-Approved Plot</th>
                    <th>Non-Approved Plot</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Layout Planning</td><td>Planned as per applicable approval</td><td>May not have approved planning</td></tr>
                  <tr><td>Road Layout</td><td>Generally planned</td><td>May vary</td></tr>
                  <tr><td>Documentation</td><td>Approval documents available</td><td>May require additional verification</td></tr>
                  <tr><td>Buyer Confidence</td><td>Generally higher</td><td>Requires extra caution</td></tr>
                  <tr><td>Legal Verification</td><td>Still required</td><td>Essential and often more complex</td></tr>
                </tbody>
              </table>
            </div>
            <p style={{ marginTop: "14px", color: "#4b5563", fontSize: "0.92rem" }}>
              Regardless of the approval status, independent legal verification is always recommended.
            </p>
          </div>

          <div className="subsection-plain">
            <h2>What Should You Verify Before Buying a DTCP Plot?</h2>
            <p>
              Buying land is a major financial decision. Before making any payment, verify the{" "}
              <b>parent documents</b> and ownership history, confirm the <b>sale deed</b>, check
              the <b>Patta</b> details, review the <b>Encumbrance Certificate (EC)</b>, request a
              copy of the <b>DTCP approval</b> and verify it with the relevant authority if
              required, confirm the <b>survey number</b> matches all documents, check{" "}
              <b>tax receipts</b>, and ensure the plot has proper legal <b>road access</b>.
            </p>
          </div>

          <div className="subsection">
            <h3>Things to Check During a Site Visit</h3>
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTY5s8OrEtW4fbS_KLdT3ZwpNa1cNULTaJtF2faskRX6aIF7d-bvJpi0sQ&s=10"
              alt="Site visit to inspect a residential plot"
            />
            <p>
              Never rely only on photos or brochures. Visit the property and check the actual plot
              location, road width, neighbouring developments, boundary markings, access roads,
              electricity availability nearby, water sources in the area, and overall surroundings.
              A physical inspection helps you compare the documents with the actual site.
            </p>
          </div>

          <div className="why-choose">
            <h2>Common Mistakes Buyers Make</h2>
            <ul className="why-list">
              <li><b>Buying only because it's cheap.</b> A lower price should never replace legal verification.</li>
              <li><b>Not checking DTCP documents.</b> Always ask for the approval copy and verify it where necessary.</li>
              <li><b>Ignoring legal opinion.</b> A qualified property lawyer can help identify potential issues before registration.</li>
              <li><b>Skipping the site visit.</b> Never buy land without seeing it in person or through a trusted representative.</li>
              <li><b>Believing verbal promises.</b> Request written proof instead of relying only on verbal assurances.</li>
            </ul>
          </div>

          <div className="success-stories">
            <h2>Success Story</h2>
            <div className="success-card">
              <div className="stars">★★★★★</div>
              <p className="quote">
                "Knowing the layout was DTCP-approved gave us confidence, but what really helped
                was having every document explained before we signed anything."
              </p>
              <div className="client">
                Karthik S. <span>Investor, Marakkanam</span>
              </div>
            </div>
          </div>

          <div className="why-choose">
            <h2>Tips for First-Time Plot Buyers</h2>
            <ul className="why-list">
              <li><b>Compare multiple layouts</b> before deciding.</li>
              <li><b>Verify every document</b> independently.</li>
              <li><b>Visit the site personally</b> rather than relying on photos.</li>
              <li><b>Confirm DTCP approval</b> with the relevant authority.</li>
              <li><b>Check surrounding development</b> and future plans.</li>
              <li><b>Consult a property lawyer</b> before registration.</li>
              <li><b>Keep copies of every document</b> for your records.</li>
            </ul>
            {/* CTA: Post Requirement Navigation */}
            <div className="cta-pill-wrap">
              <Link to="/post-requirement" className="cta-pill">
                <FileText className="w-4 h-4" /> Post Your Land Requirement
              </Link>
            </div>
          </div>

          <div className="subsection-plain">
            <h2>Frequently Asked Questions</h2>
            <div className="faq-item">
              <h3>Is Marakkanam a good place to buy a plot?</h3>
              <p>Many buyers consider Marakkanam attractive because of its location between Chennai and Pondicherry, ECR connectivity, and peaceful environment. Suitability depends on your investment goals and proper legal verification.</p>
            </div>
            <div className="faq-item">
              <h3>What is a DTCP-approved plot?</h3>
              <p>A DTCP-approved plot is part of a layout approved by the Directorate of Town and Country Planning, where applicable.</p>
            </div>
            <div className="faq-item">
              <h3>Is DTCP approval enough before buying?</h3>
              <p>No. Along with DTCP approval, you should verify ownership, Patta, Encumbrance Certificate, survey records, and other legal documents.</p>
            </div>
            <div className="faq-item">
              <h3>Can I get a bank loan for a DTCP plot?</h3>
              <p>Many lenders consider loans for eligible residential plots, subject to their policies and property verification.</p>
            </div>
            <div className="faq-item">
              <h3>Why is a site visit important?</h3>
              <p>A site visit helps you verify road access, surroundings, boundaries, and whether the actual property matches the documents.</p>
            </div>
            <div className="faq-item">
              <h3>Why choose verified plots?</h3>
              <p>Verified plots generally provide better transparency regarding documentation, helping buyers make informed decisions. Independent legal verification is still recommended.</p>
            </div>
          </div>

          <div className="final-cta">
            <h2>Ready to Explore Verified DTCP Plots in Marakkanam?</h2>
            <p>
              Let The Plot One help you discover verified DTCP-approved residential plots
              in Marakkanam, Pondicherry, Cuddalore, Villupuram, Tindivanam, and Chennai — with
              transparent guidance from selection to documentation.
            </p>
            <a
              className="final-cta-btn"
              href="https://wa.me/919403892971?text=Hi%2C%20I%27d%20like%20to%20schedule%20a%20site%20visit%20for%20DTCP%20plots%20in%20Marakkanam."
              target="_blank"
              rel="noopener noreferrer"
            >
              <ClipboardList className="w-5 h-5 mr-1" /> Schedule Your Site Visit
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
              Helping buyers find verified DTCP-approved plots across Marakkanam, Pondicherry, and
              surrounding growth corridors — from site selection to documentation.
            </p>
            <hr className="side-divider" />
            <div className="tags">
              <span className="tag-chip">#DTCPApproved</span>
              <span className="tag-chip">#Marakkanam</span>
              <span className="tag-chip">#ECR</span>
              <span className="tag-chip">#VerifiedPlots</span>
            </div>
          </div>

          <div className="side-card">
            <div className="side-label">Document Checklist</div>
            <ul className="checklist">
              <li>📄 Parent Documents</li>
              <li>📝 Sale Deed</li>
              <li>📋 Patta Verification</li>
              <li>🔍 Encumbrance Certificate (EC)</li>
              <li>✅ DTCP Approval Copy</li>
              <li>🗺️ Survey Number Match</li>
              <li>🧾 Tax Receipts</li>
              <li>🛣️ Legal Road Access</li>
            </ul>
          </div>

          <div className="side-card consult">
            <h4>Need a Consultation?</h4>
            <p>Talk to our team about verified DTCP plots in Marakkanam that match your budget and purpose.</p>
            <a
              className="wa-btn"
              href="https://wa.me/919403892971?text=Hi%2C%20I%27d%20like%20a%20consultation%20about%20DTCP%20plots%20in%20Marakkanam."
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

export default DtcpPlotsMarakkanam;
