import { renderTenFrame } from './TenFrame.js';
import { renderJarOfMarbles } from './JarOfMarbles.js';
import { renderSpinner } from './Spinner.js';
import { renderItemCounter } from './ItemCounter.js';
import { renderImage } from './Image.js';
import { drawVisualChoicePanel } from './VisualChoice.js';
import { renderSceneComposer } from './SceneComposer.js';
import { renderPlaceValue } from './PlaceValue.js';

// New Phase 1 Components
import { renderNumberLine } from './NumberLine.js';
import { renderHundredChart } from './HundredChart.js';
import { renderRekenrek } from './Rekenrek.js';
import { renderNumberBond } from './NumberBond.js';
import { renderTallyChart } from './TallyChart.js';
import { renderFractionBar } from './FractionBar.js';
import { renderFractionCircle } from './FractionCircle.js';
import { renderFractionGrid } from './FractionGrid.js';
import { renderDecimalGrid } from './DecimalGrid.js';
import { renderDecimalLine } from './DecimalLine.js';
import { renderShapeCanvas } from './ShapeCanvas.js';
import { renderCoordinatePlane } from './CoordinatePlane.js';
import { renderProtractor } from './Protractor.js';
import { renderRuler } from './Ruler.js';
import { renderGeoboard } from './Geoboard.js';
import { renderBarGraph } from './BarGraph.js';
import { renderPictograph } from './Pictograph.js';
import { renderFrequencyTable } from './FrequencyTable.js';
import { renderAnalogClock } from './AnalogClock.js';
import { renderCalendar } from './Calendar.js';
import { renderThermometer } from './Thermometer.js';
import { renderBalanceScale } from './BalanceScale.js';
import { renderMeasuringJug } from './MeasuringJug.js';
import { renderMoneyDisplay } from './MoneyDisplay.js';
import { renderPriceTagCompare } from './PriceTagCompare.js';

export const COMPONENT_REGISTRY = {
  TenFrame: renderTenFrame,
  JarOfMarbles: renderJarOfMarbles,
  Spinner: renderSpinner,
  ItemCounter: renderItemCounter,
  Image: renderImage,
  VisualChoicePanel: drawVisualChoicePanel,
  SceneComposer: renderSceneComposer,
  PlaceValue: renderPlaceValue,
  BaseTenBlocks: renderPlaceValue,

  // New Phase 1 Maps
  NumberLine: renderNumberLine,
  NumberLineInteractive: renderNumberLine, // maps both to renderNumberLine
  HundredChart: renderHundredChart,
  Rekenrek: renderRekenrek,
  NumberBond: renderNumberBond,
  TallyChart: renderTallyChart,
  FractionBar: renderFractionBar,
  FractionCircle: renderFractionCircle,
  FractionGrid: renderFractionGrid,
  DecimalGrid: renderDecimalGrid,
  DecimalLine: renderDecimalLine,
  ShapeCanvas: renderShapeCanvas,
  CoordinatePlane: renderCoordinatePlane,
  Protractor: renderProtractor,
  Ruler: renderRuler,
  Geoboard: renderGeoboard,
  BarGraph: renderBarGraph,
  Pictograph: renderPictograph,
  FrequencyTable: renderFrequencyTable,
  AnalogClock: renderAnalogClock,
  AnalogClockInteractive: renderAnalogClock, // maps both to renderAnalogClock
  Calendar: renderCalendar,
  Thermometer: renderThermometer,
  BalanceScale: renderBalanceScale,
  MeasuringJug: renderMeasuringJug,
  MoneyDisplay: renderMoneyDisplay,
  PriceTagCompare: renderPriceTagCompare
};


