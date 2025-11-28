import { useEffect, useRef } from "react";
import { OutSideProps } from "./type";

export const OutSide = (props: OutSideProps) => {
  const { onclick, children, className } = props;
  const ref: any = useRef(null);
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (ref.current && !ref.current.contains(event.target)) {
        onclick();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);
  return (
    <div className={`w-full h-full ${className}`} ref={ref}>
      {children}
    </div>
  );
};
