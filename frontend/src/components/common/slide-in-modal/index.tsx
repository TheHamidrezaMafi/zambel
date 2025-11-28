import { ReactNode } from "react";

export const SlideInModal: React.FC<{ children: ReactNode; open: boolean }> = ({
  children,
  open,
}) => {
  if (!open) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[98] transition-opacity duration-300"
        style={{ display: open ? 'block' : 'none' }}
      />
      
      {/* Modal */}
      <div
        role="dialog"
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-background shadow-2xl transform transition-transform duration-300 ease-in-out z-[99] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Modal content */}
        <div className="overflow-y-auto h-full">{children}</div>
      </div>
    </>
  );
};
