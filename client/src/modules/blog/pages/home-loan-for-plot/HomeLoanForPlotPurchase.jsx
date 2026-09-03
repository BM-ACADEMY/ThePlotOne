import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Home, ChevronRight, User, Calendar, MessageSquare, Landmark, FileText } from "lucide-react";

const CANONICAL_URL = "https://theplotone.com/blog/home-loan-for-plot";

const HomeLoanForPlotPurchase = () => {
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
        <title>Home Loan for Plot Purchase – Complete Process, Eligibility & Documents Guide (2026) | The Plot One</title>
        <meta
          name="description"
          content="Can you get a home loan for a plot? Complete 2026 guide to eligibility, step-by-step process, required documents, and what to verify before applying — with Pondicherry examples."
        />
        <link rel="canonical" href={CANONICAL_URL} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={CANONICAL_URL} />
        <meta
          property="og:title"
          content="Home Loan for Plot Purchase – Complete Process, Eligibility & Documents Guide (2026)"
        />
        <meta
          property="og:description"
          content="Eligibility, step-by-step process, required documents, and what to verify before applying for a plot loan — with Pondicherry examples."
        />
        <meta property="og:image" content="https://theplotone.com/blog/land-registration-docs.webp" />
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
        .subsection ul {
          padding-left: 22px;
          margin: 0 0 16px;
        }
        .subsection li {
          margin-bottom: 8px;
          font-size: 1rem;
          color: #374151;
        }
        .subsection ol {
          padding-left: 22px;
          margin: 0 0 16px;
        }
        .subsection ol li {
          margin-bottom: 10px;
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

        .side-card.checklist h4 {
          color: var(--navy-deep);
          font-size: 1.02rem;
          font-weight: 800;
          margin-bottom: 12px;
        }
        .chk-row {
          padding: 8px 0 8px 26px;
          border-bottom: 1px dashed var(--line);
          font-size: 0.86rem;
          color: #374151;
          position: relative;
        }
        .chk-row:last-child {
          border-bottom: none;
        }
        .chk-row::before {
          content: "✓";
          position: absolute;
          left: 0;
          top: 8px;
          color: var(--primary);
          font-weight: 800;
          font-size: 0.8rem;
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
            <span className="text-gray-800 font-semibold truncate">Home Loan Guide</span>
          </div>

          <div className="cat-pill">Home Loan Guide</div>

          <h1 className="title">
            Home Loan for Plot Purchase — Complete Process, Eligibility &amp; Documents Guide (2026)
          </h1>

          <div className="byline">
            <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-[#166aa8]" /> The Plot One Team</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#166aa8]" /> 24 July 2026</span>
          </div>

          <img
            className="hero-img"
            src="https://images.unsplash.com/photo-1559067341-04a52c7d06d2?auto=format&fit=crop&w=1600&q=80"
            alt="Housing loan letter blocks on a wooden surface"
          />

          <p>
            Buying a plot is one of the smartest long-term investments many families make. Whether you're planning
            to build your dream home, invest for the future, or purchase land near Pondicherry, financing can make
            the purchase more manageable. Many buyers assume home loans are available only for ready-built houses —
            in reality, several lenders also offer loans for eligible plot purchases, though the process differs
            from buying a completed home.
          </p>

          <div className="callout">
            <h4>Quick Answer</h4>
            <p>
              Yes, you can get a home loan for a plot from many banks and financial institutions, subject to their
              eligibility criteria and property verification. Approval usually checks your income, credit profile,
              legal documents, and the plot's approvals. Before applying, ensure the land has clear ownership and
              the required planning approvals.
            </p>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">1</span> Who Can Apply for a Plot Loan?
            </h3>
            <img
              src="https://images.unsplash.com/photo-1625225233840-695456021cde?auto=format&fit=crop&w=1200&q=80"
              alt="Calculator and pen on paper, representing loan eligibility calculation"
            />
            <p>
              Eligibility varies by lender, but applicants generally include salaried employees, self-employed
              professionals, business owners, entrepreneurs, and professionals such as doctors, engineers, and
              chartered accountants. Some lenders also consider NRIs, subject to their policies. The final decision
              depends on your income, repayment capacity, credit profile, and the property's legal status — always
              check the latest policies directly with your preferred bank.
            </p>
            <div className="cta-pill-wrap">
              <a
                className="cta-pill"
                href="https://wa.me/919403892971?text=Hi%2C%20I%27d%20like%20to%20know%20if%20I%27m%20eligible%20for%20a%20plot%20loan."
                target="_blank"
                rel="noopener noreferrer"
              >
                <Landmark className="w-4 h-4" /> Check Your Plot Loan Eligibility
              </a>
            </div>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">2</span> Home Loan for Plot — Step-by-Step Process
            </h3>
            <img
              src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80"
              alt="A person writing on a loan application form"
            />
            <ol>
              <li><strong>Choose the right plot</strong> — clear ownership, road access, planning approvals, and clean legal documents. Avoid advance payments before due diligence.</li>
              <li><strong>Verify property documents</strong> — parent documents, sale deed, patta, EC, survey records, layout approval, and tax receipts.</li>
              <li><strong>Check your eligibility</strong> — income, employment/business details, credit history, existing loans, and repayment capacity.</li>
              <li><strong>Submit your application</strong> — accurate information avoids processing delays.</li>
              <li><strong>Property verification</strong> — the lender's legal and technical checks confirm the land meets their policies.</li>
              <li><strong>Loan approval</strong> — read the sanction terms carefully before accepting.</li>
              <li><strong>Registration and disbursement</strong> — your bank explains next steps after approval.</li>
            </ol>
            <div className="cta-pill-wrap">
              <a
                className="cta-pill"
                href="https://wa.me/919403892971?text=Hi%2C%20can%20you%20walk%20me%20through%20the%20plot%20loan%20process%20step%20by%20step%3F"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Landmark className="w-4 h-4" /> Get Help With Every Step
              </a>
            </div>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">3</span> Documents Commonly Required
            </h3>
            <img
              src="/blog/land-registration-docs.webp"
              alt="Close-up of hands reviewing documents and paperwork on a desk"
            />
            <p>
              Requirements differ by lender, but typically include: <strong>identity proof</strong> (Aadhaar, PAN,
              Passport, Driving Licence), <strong>address proof</strong> (Aadhaar, Passport, utility bills, Voter
              ID), <strong>income documents</strong> (salary slips and bank statements for salaried applicants;
              business proof, ITRs, and bank statements for self-employed), and <strong>property documents</strong>
              (sale agreement, parent documents, EC, patta, layout approval, survey records). Depending on location,
              lenders may also verify DTCP or other applicable planning approvals — a loan doesn't depend on income
              alone.
            </p>
            <div className="cta-pill-wrap">
              <a
                className="cta-pill"
                href="https://wa.me/919403892971?text=Hi%2C%20can%20you%20share%20the%20full%20document%20checklist%20for%20a%20plot%20loan%3F"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText className="w-4 h-4" /> Get the Full Document Checklist
              </a>
            </div>
          </div>

          <div className="subsection">
            <h3>
              <span className="num-badge">4</span> Areas Around Pondicherry Where Buyers Commonly Purchase Plots
            </h3>
            <img
              src="https://images.unsplash.com/photo-1569157087866-f4a8e9250605?auto=format&fit=crop&w=1200&q=80"
              alt="Mustard-yellow colonial house in Pondicherry's French Quarter"
            />
            <p>
              Buyers frequently explore Kottakuppam, Kalapet, Villianur, Madagadipet, Lawspet, Moolakulam, Cuddalore
              Road, Villupuram, Tindivanam, and Cuddalore. Many Chennai buyers also look at plots around Pondicherry
              for its peaceful lifestyle and convenient road connectivity. Whichever area you choose, always verify
              legal status before applying for financing.
            </p>
            <div className="cta-pill-wrap">
              <Link to="/properties" className="cta-pill">
                <Landmark className="w-4 h-4" /> See Loan-Friendly Verified Plots
              </Link>
            </div>
          </div>

          <h2>Home Loan for Plot vs Home Loan for House</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Feature</th><th>Plot Loan</th><th>Home Loan for House</th></tr>
              </thead>
              <tbody>
                <tr><td>Purpose</td><td>Purchase of residential land</td><td>Purchase or construction of a house</td></tr>
                <tr><td>Property Type</td><td>Residential plot</td><td>Completed or under-construction home</td></tr>
                <tr><td>Property Verification</td><td>Required</td><td>Required</td></tr>
                <tr><td>Legal Document Review</td><td>Yes</td><td>Yes</td></tr>
                <tr><td>Loan Approval</td><td>Subject to lender policies</td><td>Subject to lender policies</td></tr>
                <tr><td>Future Construction</td><td>Buyer decides when to build (subject to lender terms)</td><td>House already exists or is being constructed</td></tr>
              </tbody>
            </table>
          </div>
          <p>Both loan types require legal verification, but the documentation and lender requirements may differ.</p>

          <div className="who-benefits">
            <h2>Who Benefits From a Plot Loan?</h2>
            <img
              src="https://i.ytimg.com/vi/F-eghT03jyY/maxresdefault.jpg"
              alt="Team collaborating around a table"
            />
            <p>
              Salaried employees and self-employed professionals get to spread the cost of land over time instead
              of paying the full price upfront. First-time buyers reduce the barrier to owning land. Long-term
              investors and retirement planners can secure a plot now and build later. And families building their
              dream home get a structured, verified path from purchase through construction.
            </p>
            <div className="cta-pill-wrap">
              <a
                className="cta-pill"
                href="https://wa.me/919403892971?text=Hi%2C%20I%27d%20like%20to%20know%20if%20a%20plot%20loan%20fits%20my%20situation."
                target="_blank"
                rel="noopener noreferrer"
              >
                <Landmark className="w-4 h-4" /> Ask If a Plot Loan Fits You
              </a>
            </div>
          </div>

          <div className="why-choose">
            <h2>Why Choose The Plot One</h2>
            <ul className="why-list">
              <li>
                <b>Loan-Ready Plots</b> — every listed plot has documentation prepared in the format most banks
                expect.
              </li>
              <li>
                <b>Document Support</b> — help assembling parent documents, EC, patta, and approval letters for
                your bank.
              </li>
              <li>
                <b>End-to-End Guidance</b> — from plot selection through registration and disbursement coordination.
              </li>
            </ul>
            <div className="cta-pill-wrap">
              <Link to="/post-requirement" className="cta-pill">
                <FileText className="w-4 h-4" /> Start With a Loan-Friendly Plot
              </Link>
            </div>
          </div>

          <div className="success-stories">
            <h2>Success Stories</h2>
            <div className="success-card">
              <div className="stars">★★★★★</div>
              <p className="quote">
                "We didn't know plot loans even existed. The Plot One helped us prepare the documents our
                bank asked for, and our loan was sanctioned without a single delay."
              </p>
              <div className="client">
                Arjun &amp; Kavya <span>First-time buyers, Lawspet</span>
              </div>
            </div>
          </div>

          <div className="final-cta">
            <h2>Ready to Find a Verified, Loan-Friendly Plot?</h2>
            <p>
              We help buyers explore verified residential plots across Pondicherry, Cuddalore, Villupuram,
              Tindivanam, Chennai, and surrounding areas — with transparent guidance throughout your buying journey.
            </p>
            <a
              className="final-cta-btn"
              href="https://wa.me/919403892971?text=Hi%2C%20I%27d%20like%20the%20verified%20plot%20list%20and%20help%20with%20a%20home%20loan."
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
              Pondicherry's trusted real estate partner — our verified plots come with documentation ready for bank
              review, right from day one.
            </p>
            <hr className="side-divider" />
            <div className="tags">
              <span className="tag-chip">#HomeLoan</span>
              <span className="tag-chip">#PlotLoan</span>
              <span className="tag-chip">#Pondicherry</span>
              <span className="tag-chip">#VerifiedPlots</span>
            </div>
          </div>

          <div className="side-card checklist">
            <h4>Documents You'll Need</h4>
            <div className="chk-row">Identity proof (Aadhaar / PAN / Passport)</div>
            <div className="chk-row">Address proof</div>
            <div className="chk-row">Income proof / bank statements</div>
            <div className="chk-row">Sale agreement &amp; parent documents</div>
            <div className="chk-row">EC, patta &amp; layout approval</div>
          </div>

          <div className="side-card consult">
            <h4>Need a Consultation?</h4>
            <p>Not sure if your plot qualifies for a home loan? Ask our team — no obligation.</p>
            <a
              className="wa-btn"
              href="https://wa.me/919403892971?text=Hi%2C%20I%27d%20like%20a%20free%20consultation%20about%20getting%20a%20home%20loan%20for%20a%20plot."
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

export default HomeLoanForPlotPurchase;
