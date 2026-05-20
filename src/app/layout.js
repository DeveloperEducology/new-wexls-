import './globals.css';
import 'katex/dist/katex.min.css';
import PWAInstall from '../components/PWAInstall';

export const metadata = {
  title: 'WEXLS Practice Starter',
  description: 'Clean adaptive practice starter with topic-wise generators.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <PWAInstall />
      </body>
    </html>
  );
}
