import { FilmStage } from "@/components/film/FilmStage";
import { Nav } from "@/components/Nav";
import { FaqDrum } from "@/components/FaqDrum";
import { Footer } from "@/components/Footer";
import { InView } from "@/components/InView";
import { Words } from "@/components/Words";
import { EmailPill } from "@/components/ui/EmailPill";
import { content, SITE_URL } from "@/lib/content";

export default function Home() {
  const { faq, studio, seo } = content;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: studio.name,
      url: SITE_URL,
      email: studio.email,
      description: seo.description,
      image: `${SITE_URL}/og.jpg`,
      
      areaServed: "Worldwide",
      knowsLanguage: "en",
      sameAs: [studio.linkedin, studio.youtube],
      makesOffer: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Web app development", url: `${SITE_URL}/web-app-development` } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Website design", url: `${SITE_URL}/website-design` } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Mobile app development", url: `${SITE_URL}/mobile-app-development` } },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.items.map((i) => ({ "@type": "Question", name: i.q.replace(/\*/g, ""), acceptedAnswer: { "@type": "Answer", text: i.a } })),
    },
    { "@context": "https://schema.org", "@type": "WebSite", name: studio.name, url: SITE_URL },
  ];

  return (
    <main className="film-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />
      <FilmStage />

      <div className="relative bg-ink-2">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px [background:linear-gradient(90deg,transparent,rgb(244_180_120/0.45),transparent)]" />
        <FaqDrum id="faq" warm={0.16} haze />
      </div>

      <Footer />
    </main>
  );
}
