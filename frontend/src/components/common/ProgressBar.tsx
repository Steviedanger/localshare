import React from 'react';

interface Props {
  value: number; // 0–100
  status?: 'uploading' | 'completed' | 'failed' | 'pending';
}

const STATUS_COLOUR = {
  uploading:  'var(--accent-blue)',
  completed:  'var(--accent-green)',
  failed:     'var(--accent-red)',
  pending:    'var(--text-muted)',
};

export const ProgressBar: React.FC<Props> = ({ value, status = 'uploading' }) => {
  const colour = STATUS_COLOUR[status];
  const isAnimated = status === 'uploading';

  return (
    <div
      style={{
        height: 4,
        background: 'var(--bg-active)',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: isAnimated
            ? `repeating-linear-gradient(90deg, ${colour} 0, ${colour}cc 20px, ${colour}88 20px, ${colour}cc 40px)`
            : colour,
          backgroundSize: isAnimated ? '40px 100%' : undefined,
          animation: isAnimated ? 'progressStripe 0.6s linear infinite' : undefined,
          transition: isAnimated ? undefined : 'width 0.3s ease',
          borderRadius: 2,
        }}
      />
    </div>
  );
};
