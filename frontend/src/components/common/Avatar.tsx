/**
 * Avatar — generates a deterministic colour + initials badge from a username.
 */
import React from 'react';

const COLOURS = [
  '#3d8ef0', '#2dd98a', '#f0a832', '#9d6ef0',
  '#f05252', '#0dd3d3', '#f07832', '#6ef09d',
];

function colourForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLOURS[Math.abs(hash) % COLOURS.length];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

interface Props {
  username: string;
  size?: number;
  online?: boolean;
}

export const Avatar: React.FC<Props> = ({ username, size = 36, online }) => {
  const colour = colourForName(username);
  const letters = initials(username) || '?';

  return (
    <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `${colour}22`,
          border: `1.5px solid ${colour}55`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colour,
          fontSize: size * 0.36,
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          letterSpacing: '-0.02em',
        }}
      >
        {letters}
      </div>
      {online !== undefined && (
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: '50%',
            background: online ? 'var(--accent-green)' : 'var(--text-muted)',
            border: '2px solid var(--bg-base)',
          }}
        />
      )}
    </div>
  );
};
