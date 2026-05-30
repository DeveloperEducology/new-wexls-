import './globals.css';
import 'katex/dist/katex.min.css';
import PWAInstall from '../components/PWAInstall';
import BackNavigator from '../components/BackNavigator';

export const metadata = {
  title: 'KlassChamp Practice',
  description: 'Clean adaptive practice starter with topic-wise generators.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <PWAInstall />
        {/* Mobile floating back button + Capacitor hardware back handler */}
        <BackNavigator />
      </body>
    </html>
  );
}
