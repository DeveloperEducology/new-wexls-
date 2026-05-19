import './globals.css';
import 'katex/dist/katex.min.css';

export const metadata = {
  title: 'WEXLS Practice Starter',
  description: 'Clean adaptive practice starter with topic-wise generators.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
