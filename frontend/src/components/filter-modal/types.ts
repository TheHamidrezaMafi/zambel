export type FilterModalProperties = {
  allProviders: Array<string>;
  allAirlines: Array<string>;
  resultCount: number;
  isLoading: boolean;
};

export type FilterCheckboxProperties = {
  item: string;
  name: string;
  label?: string;
};

export type FilterChipProperties = {
  isDisabled: boolean;
};
