'use client';

import './StarBorder.css';

export default function StarBorder({
  as: Component = 'button',
  className = '',
  color = 'white',
  speed = '6s',
  thickness = 1,
  backgroundColor = '#000000',
  textColor = '#ffffff',
  borderColor = '#222222',
  children,
  style = {},
  ...rest
}) {
  return (
    <Component {...rest} className={`star-border-container ${className}`} style={{ padding: `${thickness}px`, ...style }}>
      <span aria-hidden="true" className="star-border-gradient-bottom" style={{ background: `radial-gradient(circle, ${color}, transparent 10%)`, animationDuration: speed }} />
      <span aria-hidden="true" className="star-border-gradient-top" style={{ background: `radial-gradient(circle, ${color}, transparent 10%)`, animationDuration: speed }} />
      <span className="star-border-inner-content" style={{ background: backgroundColor, color: textColor, borderColor }}>{children}</span>
    </Component>
  );
}
