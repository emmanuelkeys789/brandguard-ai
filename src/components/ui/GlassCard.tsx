import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  interactive?: boolean;
  edgeSheen?: boolean;
  specular?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  accentBorder?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  interactive = false,
  edgeSheen = true,
  specular = true,
  className = '',
  style = {},
  onClick,
  accentBorder = false
}) => {
  return (
    <div
      onClick={onClick}
      className={`liquid-glass ${interactive ? 'glass-panel-interactive' : ''} ${edgeSheen ? 'glass-edge-sheen' : ''} ${specular ? 'glass-specular' : ''} ${className}`}
      style={{
        padding: '24px',
        borderColor: accentBorder ? 'var(--accent-lime-border)' : undefined,
        cursor: onClick ? 'pointer' : undefined,
        ...style
      }}
    >
      {children}
    </div>
  );
};
