import { ReactNode } from "react";

export type ModalContextType = {
  openModal: (content: ReactNode) => void;
  closeModal: () => void;
};
