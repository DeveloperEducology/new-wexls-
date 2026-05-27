'use client';

import MagicalSharingPizzaApplet from './magical-sharing-pizza/MagicalSharingPizzaApplet';
import ManipulativeLabApplet from './manipulative-lab/ManipulativeLabApplet';

export default function InteractiveAppletRenderer(props) {
  const appletType = props.question?.appletType;

  if (appletType === 'manipulative_lab') {
    return <ManipulativeLabApplet {...props} />;
  }

  return <MagicalSharingPizzaApplet {...props} />;
}
