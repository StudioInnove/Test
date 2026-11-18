import { FilmStage } from "@/components/film/FilmStage";
import { Nav } from "@/components/Nav";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { BookCall } from "@/components/BookCall";
import { content, SITE_URL } from "@/lib/content";

export default function Home() {
  const { faq, contact, studio, seo } = content;

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

      <section id="faq" className="relative bg-ink px-6 pb-28 pt-32 sm:px-10 md:pt-40">
        <div className="mx-auto grid max-w-[1200px] gap-14 md:grid-cols-[1fr_1.5fr]">
          <div>
            <p className="eyebrow mb-4">FAQ</p>
            <h2 className="display text-[clamp(40px,5vw,72px)]">{faq.heading}</h2>
          </div>
          <Faq />
        </div>
      </section>

      <section className="relative bg-ink px-6 pb-8 sm:px-10">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-8 rounded-[32px] bg-white/[0.035] p-8 ring-1 ring-white/10 sm:p-12 md:flex-row md:items-center">
          <div>
            <h2 className="text-[clamp(28px,3vw,40px)] font-semibold tracking-[-0.025em]">{contact.heading}</h2>
            <p className="mt-2 text-paper/65">{contact.line} {studio.replyPromise}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href={`mailto:${studio.email}`} className="btn btn-ghost">{studio.email}</a>
            <BookCall>{content.close.cta}</BookCall>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
