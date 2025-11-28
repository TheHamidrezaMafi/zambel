export type TabsProps = {
  list: Array<ListItem>;
  defaultTab: string;
  variant?: 'filled' | 'underline';
  queryKey: string;
};

export type ListItem = {
  label: string;
  value: string;
  disabled?: boolean;
};
