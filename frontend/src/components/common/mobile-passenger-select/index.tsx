import { FC, useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { PassengerSelectProps } from "./type";
import { OutSide } from "../out-side";
import { useSlideUpModal } from "../slide-up-modal";
import Button from "../button";

export const MobilePassengerSelect: FC<PassengerSelectProps> = ({
  control,
  name,
  label,
  Icon,
  rules,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { openModal, closeModal } = useSlideUpModal();
  const handleIncrement = (
    type: "adult" | "child",
    field: any,
    adultCount: number,
    childCount: number
  ) => {
    if (type === "adult") {
      field.onChange({ adults: adultCount + 1, children: childCount });
    } else {
      field.onChange({ adults: adultCount, children: childCount + 1 });
    }
  };

  const handleDecrement = (
    type: "adult" | "child",
    field: any,
    adultCount: number,
    childCount: number
  ) => {
    if (type === "adult" && adultCount > 0) {
      field.onChange({ adults: adultCount - 1, children: childCount });
    } else if (type === "child" && childCount > 0) {
      field.onChange({ adults: adultCount, children: childCount - 1 });
    }
  };

  return (
    <div className="relative w-full h-14 cursor-pointer">
      <Controller
        control={control}
        name={name}
        rules={rules}
        defaultValue={{ adults: 0, children: 0 }} // مقدار پیش‌فرض در اینجا تنظیم می‌شود
        render={({ field, fieldState: { error } }) => {
          const { adults, children } = field.value; // گرفتن مقدار فعلی برای بزرگسالان و کودکان
          const totalPassengers = adults + children;
          useEffect(() => {
            isFocused
              ? openModal(
                  <OutSide
                    onclick={() => {
                      setIsFocused(false);
                    }}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-lg">مسافر بزرگسال</label>
                        <div className="flex items-center">
                          <Button
                            type="button"
                            className="h-9 w-9 flex items-center justify-center"
                            onClick={() =>
                              handleIncrement("adult", field, adults, children)
                            }
                          >
                            +
                          </Button>
                          <span className="mx-2 text-xl font-semibold">
                            {adults}
                          </span>
                          <Button
                            type="button"
                            className="h-9 w-9 flex items-center justify-center"
                            onClick={() =>
                              handleDecrement("adult", field, adults, children)
                            }
                            disabled={adults === 0}
                          >
                            -
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-lg">مسافر کودک</label>
                        <div className="flex items-center">
                          <Button
                            type="button"
                            className="h-9 w-9 flex items-center justify-center"
                            onClick={() =>
                              handleIncrement("child", field, adults, children)
                            }
                          >
                            +
                          </Button>
                          <span className="mx-2 text-xl font-semibold">
                            {children}
                          </span>
                          <Button
                            type="button"
                            className="h-9 w-9 flex items-center justify-center"
                            onClick={() =>
                              handleDecrement("child", field, adults, children)
                            }
                            disabled={children === 0}
                          >
                            -
                          </Button>
                        </div>
                      </div>
                    </div>
                  </OutSide>
                )
              : closeModal();
          }, [isFocused, field]);
          return (
            <>
              <div
                className={`block w-full h-full rounded-xl font-semibold relative appearance-none bg-white border border-gray-300 py-2 px-3 leading-tight focus:outline-none focus:border-blue-500 ${
                  error && "!border-danger-600"
                }`}
                tabIndex={0}
                onFocus={() => setIsFocused(true)}
              >
                <p className="mt-2">{`   ${totalPassengers} مسافر`}</p>
              </div>
              <label
                htmlFor={name}
                className={`absolute bg-white right-3 flex items-center gap-3 top-3 text-neutral-700 text-xl px-2  pointer-events-none transition-all duration-300 ${
                  error && "!text-danger-600"
                } ${
                  isFocused || field.value
                    ? "!-top-3 !text-sm !text-[#052b61] !right-1"
                    : ""
                }`}
              >
                {Icon && !field.value && !isFocused && (
                  <Icon fill={error ? "red" : "#939598"} />
                )}
                {label}
              </label>
              {error && (
                <p className="text-sm font-normal mt-0 mr-2 text-danger-600 text-right">
                  {error.message}
                </p>
              )}
            </>
          );
        }}
      />
    </div>
  );
};
