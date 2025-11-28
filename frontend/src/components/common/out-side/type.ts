import { ReactNode } from "react";
export type OutSideProps = {
  onclick: () => void;
  children: ReactNode;
  className?: string;
};
