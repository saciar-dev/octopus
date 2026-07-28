export interface ScheduleRow {
  enter: string;
  end: string;
  session: string;
}
export interface ScheduleTableProps {
  rows?: ScheduleRow[];
  onEnter?: (row: ScheduleRow) => void;
}
export function ScheduleTable(props: ScheduleTableProps): JSX.Element;
