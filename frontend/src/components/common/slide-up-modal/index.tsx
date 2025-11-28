import {
  createContext,
  ReactNode,
  useContext,
  useState,
  MouseEvent,
} from "react";
import { ModalContextType } from "./type";
import { Close } from "../icons";

const SlideUpModalContext = createContext<ModalContextType | undefined>(
  undefined
);

export const SlideUpModalProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);

  const openModal = (content: ReactNode) => {
    setModalContent(content);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setModalContent(null), 300); // Allow animation to complete
  };

  const handleBackgroundClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  return (
    <SlideUpModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-gray-800 bg-opacity-50 flex items-end"
          onClick={handleBackgroundClick}
        ></div>
      )}
      <div
        style={{ zIndex: 99 }}
        className={`fixed bottom-0 w-full bg-white rounded-t-lg shadow-lg p-6 transform transition-transform duration-300 ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex justify-end">
          <button
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-700 mb-4"
          >
            <Close fill="#374151" className="" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[75vh]">{modalContent}</div>
      </div>
    </SlideUpModalContext.Provider>
  );
};

export const useSlideUpModal = () => {
  const context = useContext(SlideUpModalContext);
  if (!context) {
    throw new Error(
      "useSlideUpModal must be used within a SlideUpModalProvider"
    );
  }
  return context;
};
