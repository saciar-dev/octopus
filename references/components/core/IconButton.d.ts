export interface IconButtonProps {
  icon?: 'back' | 'forward' | 'refresh' | 'play' | 'close';
  size?: number;
  variant?: 'primary' | 'navy' | 'muted';
  onClick?: () => void;
  style?: React.CSSProperties;
}
export function IconButton(props: IconButtonProps): JSX.Element;
