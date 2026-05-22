import React, { useEffect, useState, useRef } from 'react';

export default function ConnectorLayer({
  containerRef,
  question,
  placements,
  layoutMode
}) {
  const [connectors, setConnectors] = useState([]);

  useEffect(() => {
    const measureConnectors = () => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newConnectors = [];

      // 1. Diagram Labeling: Draw lines from targets to their designated hotspot coordinates
      if (layoutMode === 'diagram_labeling' && question.targets) {
        question.targets.forEach(target => {
          if (target.pointerX === undefined || target.pointerY === undefined) return;

          const targetEl = containerRef.current.querySelector(`[data-target-id="${target.id}"]`);
          if (!targetEl) return;

          const targetRect = targetEl.getBoundingClientRect();

          // Calculate center of target relative to container
          const fromX = targetRect.left - containerRect.left + targetRect.width / 2;
          const fromY = targetRect.top - containerRect.top + targetRect.height / 2;

          // Calculate pointer coordinates
          // If unit is '%', calculate based on container width/height. Else treat as absolute px.
          const unit = target.unit || 'px';
          let toX = target.pointerX;
          let toY = target.pointerY;

          if (unit === '%') {
            toX = (target.pointerX / 100) * containerRect.width;
            toY = (target.pointerY / 100) * containerRect.height;
          }

          newConnectors.push({
            id: `diag-${target.id}`,
            fromX,
            fromY,
            toX,
            toY,
            color: '#64748b',
            strokeWidth: 2,
            dashArray: '4,4',
            showArrow: false,
            showDot: true
          });
        });
      }

      // 2. Flowchart Connectors: Draw arrows between flowchart steps
      if (layoutMode === 'flowchart' && question.connectors) {
        question.connectors.forEach((conn, idx) => {
          const fromEl = containerRef.current.querySelector(`[data-target-id="${conn.from}"]`);
          const toEl = containerRef.current.querySelector(`[data-target-id="${conn.to}"]`);
          if (!fromEl || !toEl) return;

          const fromRect = fromEl.getBoundingClientRect();
          const toRect = toEl.getBoundingClientRect();

          // Draw from bottom of source to top of destination
          const fromX = fromRect.left - containerRect.left + fromRect.width / 2;
          const fromY = fromRect.bottom - containerRect.top;
          const toX = toRect.left - containerRect.left + toRect.width / 2;
          const toY = toRect.top - containerRect.top;

          newConnectors.push({
            id: `flow-${idx}`,
            fromX,
            fromY,
            toX,
            toY,
            color: '#0f172a',
            strokeWidth: 2.5,
            showArrow: true,
            showDot: false
          });
        });
      }

      // 3. Matching Layout: Draw lines from left prompts to placed right targets
      if (layoutMode === 'matching') {
        // In matching, question.prompts defines left column elements e.g. { id, label }
        // placements is { itemId: targetId }
        // Each item in question.items matches a prompt. Let's trace placements.
        question.items.forEach(item => {
          const targetId = placements[item.id];
          if (!targetId) return;

          // Find the prompt associated with this item (usually matches index or explicit promptId)
          const promptId = item.promptId || item.id.replace('item_', 'prompt_');
          const promptEl = containerRef.current.querySelector(`[data-prompt-id="${promptId}"]`);
          const targetEl = containerRef.current.querySelector(`[data-target-id="${targetId}"]`);
          if (!promptEl || !targetEl) return;

          const promptRect = promptEl.getBoundingClientRect();
          const targetRect = targetEl.getBoundingClientRect();

          // Draw from right center of prompt to left center of target
          const fromX = promptRect.right - containerRect.left;
          const fromY = promptRect.top - containerRect.top + promptRect.height / 2;
          const toX = targetRect.left - containerRect.left;
          const toY = targetRect.top - containerRect.top + targetRect.height / 2;

          newConnectors.push({
            id: `match-${item.id}`,
            fromX,
            fromY,
            toX,
            toY,
            color: '#2563eb',
            strokeWidth: 2,
            showArrow: false,
            showDot: true
          });
        });
      }

      setConnectors(newConnectors);
    };

    // Use ResizeObserver for more robust dimensions updates
    let observer;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      observer = new ResizeObserver(() => {
        measureConnectors();
      });
      observer.observe(containerRef.current);
    }

    // Run measurement
    measureConnectors();

    const handle = requestAnimationFrame(measureConnectors);
    window.addEventListener('resize', measureConnectors);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', measureConnectors);
      cancelAnimationFrame(handle);
    };
  }, [question, placements, layoutMode, containerRef]);

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5
      }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#0f172a" />
        </marker>
        <marker
          id="arrowhead-blue"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#2563eb" />
        </marker>
      </defs>

      {connectors.map(c => {
        // Adjust for arrowhead pointer overlap if showArrow is true
        const deltaX = c.toX - c.fromX;
        const deltaY = c.toY - c.fromY;
        const dist = Math.hypot(deltaX, deltaY);
        let adjustedToX = c.toX;
        let adjustedToY = c.toY;
        
        if (c.showArrow && dist > 12) {
          adjustedToX = c.toX - (deltaX / dist) * 8;
          adjustedToY = c.toY - (deltaY / dist) * 8;
        }

        return (
          <g key={c.id}>
            {/* Draw Path */}
            <path
              d={`M ${c.fromX} ${c.fromY} L ${adjustedToX} ${adjustedToY}`}
              fill="none"
              stroke={c.color}
              strokeWidth={c.strokeWidth}
              strokeDasharray={c.dashArray || 'none'}
              markerEnd={c.showArrow ? 'url(#arrowhead)' : 'none'}
            />

            {/* Draw Start/End circles for better visuals */}
            {c.showDot && (
              <>
                <circle cx={c.fromX} cy={c.fromY} r="4" fill={c.color} />
                <circle cx={c.toX} cy={c.toY} r="4" fill={c.color} />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
