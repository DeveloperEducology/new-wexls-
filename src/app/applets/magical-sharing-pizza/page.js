import MagicalSharingPizzaApplet from '@/components/practice/applets/magical-sharing-pizza/MagicalSharingPizzaApplet';

export const metadata = {
  title: 'The Magical Sharing Pizza'
};

const demoQuestion = {
  type: 'interactiveApplet',
  appletType: 'magical_sharing_pizza',
  questionText: 'Explore halves and quarters by sharing pizza.',
  modes: ['lesson', 'sandbox', 'quiz'],
  defaultMode: 'lesson',
  metadata: {
    subject: 'math',
    topic: 'fractions',
    skillId: 'fractions-k-sharing-pizza'
  }
};

export default function MagicalSharingPizzaDemoPage() {
  return (
    <main style={{
      minHeight: '100vh',
      padding: '28px 16px',
      background: '#FDFCF8'
    }}>
      <MagicalSharingPizzaApplet question={demoQuestion} />
    </main>
  );
}
