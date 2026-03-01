import { memo } from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

export const GlowEdge = memo(function GlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      {/* Glow layer */}
      <BaseEdge
        id={`${id}-glow`}
        path={edgePath}
        style={{
          ...style,
          stroke: '#22d3ee',
          strokeWidth: 6,
          strokeOpacity: 0.08,
          filter: 'blur(4px)',
        }}
      />
      {/* Main edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: '#22d3ee',
          strokeWidth: 1.5,
          strokeOpacity: 0.6,
        }}
      />
      {/* Animated dash overlay */}
      <path
        d={edgePath}
        fill="none"
        stroke="#22d3ee"
        strokeWidth="1.5"
        strokeDasharray="6 6"
        strokeOpacity="0.4"
        className="glow-edge-path"
      />
    </>
  );
});
