import { ComponentType } from "react";
import {
  Control,
  FieldValues,
  UseControllerProps,
  UseFormSetError,
} from "react-hook-form";

export interface PassengerSelectProps extends UseControllerProps {
  control: Control<any>;
  name: string;
  label: string;
  Icon?: ComponentType<any>;
}
