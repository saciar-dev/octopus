export interface TabsProps {
  items?: string[];
  active?: string;
  onChange?: (item: string) => void;
}
export function Tabs(props: TabsProps): JSX.Element;
