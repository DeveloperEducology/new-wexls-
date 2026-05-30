import Link from 'next/link';
import Image from 'next/image';

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-container">
        <Link href="/" className="site-logo">
          <Image
            src="/images/klasschamp_logo.png"
            alt="KlassChamp Logo"
            width={40}
            height={40}
            className="logo-image"
          />
          <span className="logo-text">KlassChamp</span>
        </Link>
        <div className="site-header-actions">
          <Link href="/practice" className="btn-start-practice">
            Quick Practice
          </Link>
        </div>
      </div>
    </header>
  );
}
