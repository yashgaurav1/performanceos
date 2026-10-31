import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ContentShell } from "@/components/content/content-shell";
import { GUIDE_ARTICLES } from "@/data/guide-articles";
import { Card } from "@/components/ui/primitives";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return Object.keys(GUIDE_ARTICLES).map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = GUIDE_ARTICLES[slug];
  if (!article) return {};

  return {
    title: `${article.title} · PerformanceOS Guides`,
    description: article.subtitle,
    alternates: {
      canonical: `/guides/${slug}`,
    },
  };
}

export default async function GuideArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = GUIDE_ARTICLES[slug];
  if (!article) notFound();

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://osperformance.vercel.app";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.subtitle,
    datePublished: article.publishedDate,
    dateModified: article.publishedDate,
    author: {
      "@type": "Person",
      name: "Yash Gaurav",
      url: `${SITE_URL}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: "PerformanceOS",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/guides/${slug}`,
    },
  };

  return (
    <ContentShell
      eyebrow={article.category}
      title={article.title}
      subtitle={article.subtitle}
      lastUpdated={article.lastUpdated}
      sources={article.sources}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Guides", href: "/guides" },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* AEO Core Question & Direct Answer */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F4] pt-2">
          {article.question}
        </h2>
        <p className="text-base sm:text-lg font-medium text-[#F5F5F4] bg-white/[0.03] p-5 rounded-2xl border border-white/10 leading-relaxed">
          {article.directAnswer}
        </p>
      </section>

      {/* Structured In-Depth Sections */}
      {article.sections.map((section, idx) => (
        <section key={idx} className="space-y-4 pt-4">
          <h3 className="text-lg sm:text-xl font-bold text-[#F5F5F4]">
            {section.heading}
          </h3>
          {section.body.map((p, pIdx) => (
            <p key={pIdx}>{p}</p>
          ))}
        </section>
      ))}

      {/* Interactive Tool Banner */}
      {article.toolLink && (
        <div className="my-8 p-6 rounded-2xl bg-[#151517] border border-white/10 not-prose flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-sans uppercase text-[#3CC8C0] block">Interactive Tool</span>
            <div className="text-base font-bold text-[#F5F5F4] mt-0.5">{article.toolLink.label}</div>
          </div>
          <Link
            href={article.toolLink.href}
            className="px-5 py-2.5 rounded-xl bg-[#3CC8C0] text-black text-xs font-bold hover:bg-[#3CC8C0]/90 transition-colors shrink-0"
          >
            Open Calculator →
          </Link>
        </div>
      )}

      {/* Related Guides */}
      {article.relatedGuides.length > 0 && (
        <div className="pt-8 border-t border-white/[0.08] not-prose">
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#A1A1AA] mb-4">
            Related Guides
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {article.relatedGuides.map((relSlug) => {
              const rel = GUIDE_ARTICLES[relSlug];
              if (!rel) return null;
              return (
                <Link key={relSlug} href={`/guides/${relSlug}`}>
                  <Card className="p-4 hover:border-white/20 transition-all h-full flex flex-col justify-between">
                    <span className="text-[11px] text-[#FF5533] font-sans">{rel.category}</span>
                    <div className="text-sm font-bold text-[#F5F5F4] mt-1">{rel.title}</div>
                    <span className="text-xs text-[#3CC8C0] mt-3 block font-medium">Read guide →</span>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </ContentShell>
  );
}
