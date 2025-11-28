// components/FloatingLabelSelect.tsx
import { FC, useState } from "react";
import { Control, Controller } from "react-hook-form";
import { FloatingLabelSelectProps } from "./type";

export const Select = ({
  control,
  name,
  label,
  options,
  Icon,
  rules,
  defaultValue,
}: FloatingLabelSelectProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // تابع فیلتر کردن گزینه‌ها بر اساس ورودی جستجو
  const filterOptions = (search: string) => {
    if (!search) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    );
  };

  return (
    <div className="relative w-full h-14 cursor-pointer">
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field, fieldState: { error } }) => (
          <>
            <input
              type="text"
              value={
                isFocused
                  ? searchValue
                  : field?.value
                  ? options?.find((option) => option.value === field.value)
                      ?.label
                  : ""
              }
              onChange={(e) => {
                setSearchValue(e.target.value);
                field.onChange(e.target.value);
              }}
              className={`block min-w-40 rounded-xl w-full font-semibold h-14 relative appearance-none bg-white border border-gray-300 py-2 px-3 leading-tight focus:outline-none focus:border-blue-500 ${
                error && "!border-danger-600"
              }`}
              tabIndex={0}
              onFocus={() => {
                setIsFocused(true);
                setSearchValue(
                  options?.find((option) => option.value === field.value)
                    ?.label ?? ""
                );
              }}
              onBlur={() => {
                setTimeout(() => {
                  setIsFocused(false);
                }, 300);
                field.onBlur(); // Call the original onBlur handler from react-hook-form
              }}
              // placeholder={label}
            />
            {isFocused && (
              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 h-52 overflow-y-auto">
                {filterOptions(searchValue)?.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center gap-1.5 px-3 py-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      field.onChange(option.value); // Update the value
                      setIsFocused(false);
                      setSearchValue(""); // Reset search value on selection
                    }}
                  >
                    {Icon && (
                      <Icon className="shrink-0 scale-75" fill={"#939598"} />
                    )}
                    {option.label}
                  </div>
                ))}
              </div>
            )}
            <label
              htmlFor={name}
              className={`absolute right-3 flex bg-white items-center gap-3 top-3 text-neutral-700 text-sm px-2  pointer-events-none transition-all duration-300 ${
                error && "!text-danger-600"
              } ${
                isFocused || field.value
                  ? "!-top-[12px] text-sm !text-[#052b61]"
                  : ""
              }`}
            >
              {Icon && !field.value && isFocused === false && (
                <Icon width="24" fill={error ? "red" : "#939598"} />
              )}
              {label}
            </label>
            {error && (
              <p className="text-sm font-normal mt-0 mr-2 text-danger-600 text-right">
                {error.message}
              </p>
            )}
          </>
        )}
      />
    </div>
  );
};
