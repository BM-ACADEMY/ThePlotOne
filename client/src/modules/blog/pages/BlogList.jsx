import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, ChevronRight } from "lucide-react";

const BlogList = () => {
  useEffect(() => {
    // Scroll to top on mount
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: "instant" });
    }
  }, []);

  const blogs = [
    {
      id: 1,
      slug: "dtcp-approved-plots-in-pondicherry",
      url: "/blog/dtcp-approved-plots-in-pondicherry",
      title: "DTCP Approved Plots in Pondicherry – Everything You Need to Know Before Buying",
      excerpt:
        "Buying land is one of the biggest financial decisions a family makes. Make sure your residential layout is legally planned, bank-loan friendly, and safe from future legal disputes.",
      category: "Real Estate Guide",
      image: "/blog/dtcp-approved-plots.webp",
      author: "The Plot One Team",
      date: "Jul 29, 2026",
      categoryBg: "bg-blue-50 text-blue-700 border border-blue-100",
    },
    {
      id: 2,
      slug: "plot-price-in-pondicherry",
      url: "/blog/plot-price-in-pondicherry",
      title: "Plot Price in Pondicherry (Area-Wise) – Complete Guide for Home Buyers & Investors",
      excerpt:
        "Pondicherry has become one of South India's fastest-growing real estate destinations. Understanding the plot price in Pondicherry is the first step toward making a smart investment.",
      category: "Pricing & Investment Guide",
      image: "/blog/pondicherry-growth.webp",
      author: "The Plot One Team",
      date: "Jul 30, 2026",
      categoryBg: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    },
    {
      id: 3,
      slug: "dtcp-vs-cmda-approval",
      url: "/blog/dtcp-vs-cmda-approval",
      title: "DTCP vs CMDA Approval – Which One Should You Choose?",
      excerpt:
        "DTCP vs CMDA vs RERA explained in simple English — where each applies, how they differ, and which approval matters for plots near Pondicherry, Villupuram, and Chennai.",
      category: "Legal & Approval Guide",
      image: "/blog/land-registration-docs.webp",
      author: "The Plot One Team",
      date: "Aug 3, 2026",
      categoryBg: "bg-amber-50 text-amber-700 border border-amber-100",
    },
    {
      id: 4,
      slug: "land-investment-pondicherry",
      url: "/blog/land-investment-pondicherry",
      title: "Is Land Investment in Pondicherry Worth It? A Complete Guide for Smart Property Buyers",
      excerpt:
        "Is land investment in Pondicherry a good idea? A complete guide covering why land beats apartments, popular areas, factors to check, and Pondicherry vs nearby Tamil Nadu.",
      category: "Investment Guide",
      image: "/blog/pondy1.webp",
      author: "The Plot One Team",
      date: "Aug 6, 2026",
      categoryBg: "bg-sky-50 text-sky-700 border border-sky-100",
    },
    {
      id: 5,
      slug: "home-loan-for-plot",
      url: "/blog/home-loan-for-plot",
      title: "Home Loan for Plot Purchase — Complete Process, Eligibility & Documents Guide (2026)",
      excerpt:
        "Can you get a home loan for a plot? Complete 2026 guide to eligibility, step-by-step process, required documents, and what to verify before applying — with Pondicherry examples.",
      category: "Home Loan Guide",
      image: "/blog/homeloan.webp",
      author: "The Plot One Team",
      date: "Aug 8, 2026",
      categoryBg: "bg-violet-50 text-violet-700 border border-violet-100",
    },
    {
      id: 6,
      slug: "best-areas-to-buy-plots-pondicherry",
      url: "/blog/best-areas-to-buy-plots-pondicherry",
      title: "Best Areas to Buy Plots in Pondicherry (2026) — A Complete Location Guide",
      excerpt:
        "Kottakuppam, Kalapet, Villianur, Lawspet and more — a complete area-by-area guide to the best locations to buy plots in Pondicherry, with a comparison table and buyer checklist.",
      category: "Pondicherry Real Estate",
      image: "/blog/beach.webp",
      author: "The Plot One Team",
      date: "Aug 10, 2026",
      categoryBg: "bg-rose-50 text-rose-700 border border-rose-100",
    },
    {
      id: 7,
      slug: "dtcp-plots-marakkanam",
      url: "/blog/dtcp-plots-marakkanam",
      title: "DTCP Plots in Marakkanam — Complete Buyer's Guide for Smart Land Investment (2026)",
      excerpt:
        "Marakkanam is emerging as a popular land investment destination between Chennai and Pondicherry. A complete guide to DTCP-approved plots, documents to verify, and buyer tips.",
      category: "DTCP Plots • Marakkanam",
      image: "/blog/marakkanam.webp",
      author: "The Plot One Team",
      date: "Aug 13, 2026",
      categoryBg: "bg-cyan-50 text-cyan-700 border border-cyan-100",
    },
    {
      id: 8,
      slug: "property-registration-process-tamil-nadu",
      url: "/blog/property-registration-process-tamil-nadu",
      title: "Property Registration Process in Tamil Nadu — Complete Step-by-Step Guide for Land & Plot Buyers (2026)",
      excerpt:
        "Complete step-by-step guide to the property registration process in Tamil Nadu — documents required, Sub-Registrar Office visit, biometric verification, and what to check before signing.",
      category: "Legal & Registration Guide",
      image: "/blog/land-registration-docs.webp",
      author: "The Plot One Team",
      date: "Aug 17, 2026",
      categoryBg: "bg-violet-50 text-violet-700 border border-violet-100",
    },
    {
      id: 9,
      slug: "nri-property-investment-pondicherry",
      url: "/blog/nri-property-investment-pondicherry",
      title: "NRI Property Investment Pondicherry — Complete Guide to Buying Plots & Land in 2026",
      excerpt:
        "Complete guide to NRI property investment in Pondicherry — eligibility, best areas, documents to verify, planning approvals, and mistakes to avoid before buying land.",
      category: "NRI Investment • Pondicherry",
      image: "/blog/nri.webp",
      author: "The Plot One Team",
      date: "Aug 19, 2026",
      categoryBg: "bg-indigo-50 text-indigo-700 border border-indigo-100",
    },
    {
      id: 10,
      slug: "plots-for-sale-villupuram",
      url: "/blog/plots-for-sale-villupuram",
      title: "Plots for Sale in Villupuram — Complete Guide for Homebuyers & Investors",
      excerpt:
        "Complete guide to plots for sale in Villupuram — connectivity, popular locations, documents to verify, DTCP approval, and tips for homebuyers and investors.",
      category: "Plots for Sale • Villupuram",
      image: "/blog/Villupuram.webp",
      author: "The Plot One Team",
      date: "Aug 24, 2026",
      categoryBg: "bg-teal-50 text-teal-700 border border-teal-100",
    },
    {
      id: 11,
      slug: "dtcp-plots-tindivanam",
      url: "/blog/dtcp-plots-tindivanam",
      title: "DTCP Plots in Tindivanam — Complete Guide for Homebuyers & Investors",
      excerpt:
        "Complete guide to DTCP plots in Tindivanam — connectivity, documents to verify, DTCP approval explained, common mistakes, and tips for homebuyers and investors.",
      category: "DTCP Plots • Tindivanam",
      image: "/blog/Tindivanam.webp",
      author: "The Plot One Team",
      date: "Aug 26, 2026",
      categoryBg: "bg-orange-50 text-orange-700 border border-orange-100",
    },
    {
      id: 12,
      slug: "plots-for-sale-cuddalore",
      url: "/blog/plots-for-sale-cuddalore",
      title: "Plots for Sale in Cuddalore — Complete Guide for Homebuyers & Investors",
      excerpt:
        "Complete guide to plots for sale in Cuddalore — connectivity, popular localities, documents to verify, approved layouts, and tips for homebuyers and investors.",
      category: "Plots for Sale • Cuddalore",
      image: "/blog/Cuddalore.webp",
      author: "The Plot One Team",
      date: "Aug 28, 2026",
      categoryBg: "bg-cyan-50 text-cyan-700 border border-cyan-100",
    },
  ];

  return (
    <div className="bg-[#f8fafc] min-h-screen pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 mb-8 text-xs font-semibold text-slate-500">
          <Home className="w-3.5 h-3.5" />
          <Link to="/" className="hover:text-[#166aa8] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-800">Blog</span>
        </div>

        {/* Header Section */}
        <div className="text-left max-w-3xl mb-12">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-3 font-sans">
            Our Latest Insights
          </h1>
          <p className="text-base text-slate-600 font-normal">
            Explore the latest guides, market trends, and expert advice on buying plots and properties in Pondicherry.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl">
          {[...blogs].reverse().map((blog) => (
            <article
              key={blog.id}
              className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 w-full"
            >
              {/* Image with Zoom Effect */}
              <Link to={blog.url} className="block overflow-hidden relative aspect-video">
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
              </Link>

              {/* Content */}
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  {/* Category Pill */}
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-4 ${blog.categoryBg}`}
                  >
                    {blog.category}
                  </span>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-slate-900 mb-3 leading-snug hover:text-[#166aa8] transition-colors">
                    <Link to={blog.url}>{blog.title}</Link>
                  </h3>

                  {/* Excerpt */}
                  <p className="text-slate-600 text-sm leading-relaxed mb-6 font-normal">
                    {blog.excerpt}
                  </p>
                </div>

                {/* Author Info */}
                <div className="flex items-center pt-4 border-t border-slate-100">
                  <img
                    src="/Logo/logo.webp"
                    alt="The Plot One"
                    className="w-12 h-12 object-contain mr-3 shrink-0"
                  />
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 leading-tight">
                      {blog.author}
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5">{blog.date}</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogList;
