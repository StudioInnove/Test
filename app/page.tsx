import { FilmStage } from "@/components/film/FilmStage";
import { Nav } from "@/components/Nav";
import { Faq } from "@/components/Faq";
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
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Mobile app development", url: `${SITE_URL}/mobile-app-development` } },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
    },
    { "@context": "https://schema.org", "@type": "WebSite", name: studio.name, url: SITE_URL },
  ];

  return (
    <main className="film-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />
      <FilmStage />

      <section id="faq" className="relative overflow-hidden bg-ink-2 px-[var(--gutter)] py-24 md:py-40">
        {/* a faint warm light, as if from the studio upstairs */}
        <div aria-hidden className="pointer-events-none absolute -left-[20%] top-0 h-[70%] w-[70%] [background:radial-gradient(closest-side,rgb(232_161_90/0.07),transparent)]" />
        <InView className="relative grid gap-14 md:grid-cols-5 md:gap-[34px]" threshold={0.1}>
          <div className="md:col-span-2">
            <h2 className="t-title"><Words text={faq.heading} /></h2>
            <p className="rise t-lead mt-4 max-w-[30ch]" style={{ ["--d" as string]: "300ms" }}>
              {faq.line} {studio.replyPromise}
            </p>
            <div className="rise mt-8" style={{ ["--d" as string]: "450ms" }}>
              <EmailPill email={studio.email} />
            </div>
          </div>
          <div className="md:col-span-3">
            <Faq />
          </div>
        </InView>
      </section>

      <Footer />
    </main>
  );
}
