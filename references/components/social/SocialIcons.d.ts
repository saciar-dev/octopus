export interface SocialIconsProps {
  networks?: ('facebook' | 'instagram' | 'linkedin' | 'twitter')[];
  size?: number;
  /** relative path prefix to the design system root, e.g. "../../" */
  basePath?: string;
}
export function SocialIcons(props: SocialIconsProps): JSX.Element;
