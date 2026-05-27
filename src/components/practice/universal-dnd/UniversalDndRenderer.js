import React, { useRef } from 'react';
import normalizeUniversalDndQuestion from './normalizeUniversalDndQuestion';
import useUniversalDnd from './useUniversalDnd';
import DragLayer from './components/DragLayer';
import ConnectorLayer from './components/ConnectorLayer';

// Layout Engines
import CategorySortLayout from './layouts/CategorySortLayout';
import DiagramLabelingLayout from './layouts/DiagramLabelingLayout';
import FlowchartLayout from './layouts/FlowchartLayout';
import TimelineLayout from './layouts/TimelineLayout';
import OrderingLayout from './layouts/OrderingLayout';
import MatchingLayout from './layouts/MatchingLayout';
import TableFillLayout from './layouts/TableFillLayout';
import HotspotLayout from './layouts/HotspotLayout';
import ShelfSortLayout from './layouts/ShelfSortLayout';

export const UniversalDndContext = React.createContext({
  cardStyle: null,
  hideItemLabels: false,
  layoutMode: null
});

export default function UniversalDndRenderer({
  question,
  userAnswer,
  onAnswer,
  isAnswered
}) {
  const containerRef = useRef(null);

  // 1. Normalize the question structure
  const normalizedQuestion = normalizeUniversalDndQuestion(question);
  const { layoutMode, items } = normalizedQuestion;

  // 2. Wire up the drag-and-drop state hook
  const dndState = useUniversalDnd({
    question: normalizedQuestion,
    userAnswer,
    onAnswer,
    isAnswered
  });

  // 3. Select appropriate layout engine
  const renderLayout = () => {
    switch (layoutMode) {
      case 'category_sort':
        return (
          <CategorySortLayout
            question={normalizedQuestion}
            dndState={dndState}
            isAnswered={isAnswered}
          />
        );
      case 'diagram_labeling':
        return (
          <DiagramLabelingLayout
            question={normalizedQuestion}
            dndState={dndState}
            isAnswered={isAnswered}
            containerRef={containerRef}
          />
        );
      case 'flowchart':
        return (
          <FlowchartLayout
            question={normalizedQuestion}
            dndState={dndState}
            isAnswered={isAnswered}
          />
        );
      case 'timeline':
        return (
          <TimelineLayout
            question={normalizedQuestion}
            dndState={dndState}
            isAnswered={isAnswered}
          />
        );
      case 'ordering':
        return (
          <OrderingLayout
            question={normalizedQuestion}
            dndState={dndState}
            isAnswered={isAnswered}
          />
        );
      case 'matching':
        return (
          <MatchingLayout
            question={normalizedQuestion}
            dndState={dndState}
            isAnswered={isAnswered}
          />
        );
      case 'table_fill':
        return (
          <TableFillLayout
            question={normalizedQuestion}
            dndState={dndState}
            isAnswered={isAnswered}
          />
        );
      case 'hotspot':
        return (
          <HotspotLayout
            question={normalizedQuestion}
            dndState={dndState}
            isAnswered={isAnswered}
          />
        );
      case 'shelf_sort':
        return (
          <ShelfSortLayout
            question={normalizedQuestion}
            dndState={dndState}
            isAnswered={isAnswered}
          />
        );
      default:
        return (
          <CategorySortLayout
            question={normalizedQuestion}
            dndState={dndState}
            isAnswered={isAnswered}
          />
        );
    }
  };

  const wrapperStyle = {
    position: 'relative',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  // Connectors are drawn for diagram labeling, flowcharts, timelines and matching layouts
  const needsConnectors = [
    'diagram_labeling',
    'flowchart',
    'matching'
  ].includes(layoutMode);

  const cardStyleVal = normalizedQuestion.cardStyle || normalizedQuestion.behavior?.cardStyle || normalizedQuestion.itemCardStyle || normalizedQuestion.imageCardStyle || normalizedQuestion.cardVariant;
  const hideItemLabelsVal = Boolean(normalizedQuestion.hideItemLabels || normalizedQuestion.behavior?.hideItemLabels);

  return (
    <UniversalDndContext.Provider value={{ cardStyle: cardStyleVal, hideItemLabels: hideItemLabelsVal, layoutMode }}>
      <div 
        ref={containerRef} 
        style={wrapperStyle}
        onPointerMove={dndState.handlePointerMove}
      >
        {/* 1. Main Layout Engine */}
        {renderLayout()}

        {/* 2. SVG Connections Overlay */}
        {needsConnectors && (
          <ConnectorLayer
            containerRef={containerRef}
            question={normalizedQuestion}
            placements={dndState.placements}
            layoutMode={layoutMode}
          />
        )}

        {/* 3. Drag layer preview clone */}
        <DragLayer
          draggingItemId={dndState.draggingItemId}
          dragState={dndState.dragState}
          items={items}
        />
      </div>
    </UniversalDndContext.Provider>
  );
}
