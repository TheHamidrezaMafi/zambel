export const convertDateToString = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleDateString('fa-IR', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

export const convertDateToTime = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  const hours = date.getHours().toString().padStart(2, '0'); // تبدیل به دو رقمی
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
};

export const getDurationTime = (departure: string, arrival: string) => {
  const dep = new Date(departure);
  const arr = new Date(arrival);
  const diffMs = Math.abs(arr.getTime() - dep.getTime());
  const minutes = Math.floor(diffMs / 1000 / 60);
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins
    .toString()
    .padStart(2, '0')}`;
};
