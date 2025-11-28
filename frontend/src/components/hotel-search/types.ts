interface Participants {
  adults: number;
  children: number;
}

export interface FormValues {
  participants: Participants;
  destination: string;
  end: string;
  start: string;
}
