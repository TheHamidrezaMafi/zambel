type City = {
  code: string;
  name: string;
};
export interface FormValues {
  destination?: City;
  origin?: City;
  end?: string;
  start?: string;
}
