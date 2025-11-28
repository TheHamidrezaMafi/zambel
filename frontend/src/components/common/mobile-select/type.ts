import { ComponentType } from 'react';
import { Control, UseControllerProps } from 'react-hook-form';
export type OptionType = {
  value: string;
  label: string;
}[];
export interface FloatingLabelSelectProps extends UseControllerProps {
  control: Control<any>;
  name: string;
  label: string;
  options: OptionType;
  Icon?: ComponentType<any>;
}
