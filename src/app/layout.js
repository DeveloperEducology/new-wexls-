import './globals.css';
import 'katex/dist/katex.min.css';
import PWAInstall from '../components/PWAInstall';
import BackNavigator from '../components/BackNavigator';

export const metadata = {
  title: 'KlassChamp | Adaptive Practice for K-10, JNVST, IMO & School Exams',
  description: 'Interactive adaptive practice worksheets for Math, English, and Science. Custom exercises for classes K-10, JNVST (Navodaya), and IMO Olympiads with step-by-step visual explanations.',
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
