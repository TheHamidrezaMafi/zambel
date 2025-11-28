import { ButtonHTMLAttributes, PropsWithChildren } from "react";

export interface ButtonProps extends PropsWithChildren {
  color?: "primary" | "secondary" | "info";
  loading?: boolean;
  className?: string;
  disabled?: boolean;
  type?: "button" | "reset" | "submit";
  onClick?: () => void;
}
