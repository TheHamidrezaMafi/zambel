import { CSSProperties, ReactNode } from "react";

export interface IconProperties {
  width?: string;
  height?: string;
  viewBox?: string;
  fill?: string;
  xmlns?: string;
  className?: string;
  style?: CSSProperties;
  borderFill?: string;
}
export interface BaseIconProperties extends IconProperties {
  children?: ReactNode;
}
