import Image from 'next/image';
import Link from 'next/link';

export default function HomeHero({
  title = "Interactive & Adaptive Practice",
  subtitle = "Master Math, English, and Science with gamified worksheets and interactive visual tools built for your level.",
  showCTA = false,
  ctaText = "Explore Grade Curriculum ›",
  ctaHref = "/grades"
}) {
  return (
    <section className="home-hero" aria-label="KlassChamp learning hero">
      <div className="home-hero-frame">
        <Image
          className="home-hero-image home-hero-image-desktop"
          src="/images/countryside_science_v2_desktop.png"
          alt="Countryside geometric science adventure hero - Desktop"
          width={1024}
          height={1024}
          priority
        />
        <Image
          className="home-hero-image home-hero-image-mobile"
          src="/images/countryside_science_v2.png"
          alt="Countryside geometric science adventure hero - Mobile"
          width={1024}
          height={1024}
          priority
        />
        <div className="home-hero-overlay">
          <div className="home-hero-overlay-content">
            <h1>{title}</h1>
            <p>{subtitle}</p>
            {showCTA && (
              <Link href={ctaHref} className="hero-cta-btn">
                {ctaText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
