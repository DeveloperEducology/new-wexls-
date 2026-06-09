import { renderTenFrame } from './TenFrame.js';
import { renderJarOfMarbles } from './JarOfMarbles.js';
import { renderSpinner } from './Spinner.js';
import { renderItemCounter } from './ItemCounter.js';
import { renderImage } from './Image.js';
import { drawVisualChoicePanel } from './VisualChoice.js';
import { renderSceneComposer } from './SceneComposer.js';
import { renderPlaceValue } from './PlaceValue.js';

export const COMPONENT_REGISTRY = {
  TenFrame: renderTenFrame,
  JarOfMarbles: renderJarOfMarbles,
  Spinner: renderSpinner,
  ItemCounter: renderItemCounter,
  Image: renderImage,
  VisualChoicePanel: drawVisualChoicePanel,
  SceneComposer: renderSceneComposer,
  PlaceValue: renderPlaceValue,
  BaseTenBlocks: renderPlaceValue
};

