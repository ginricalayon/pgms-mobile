interface ProfileData {
  membershipId: string;
  firstName: string;
  lastName: string;
  username: string;
  gender: string;
  birthdate: string;
  address: string;
  phoneNumber: string;
  isRegular: number;
  picture: string;
}

interface membershipDetails {
  membershipId: string;
  customerFirstName: string;
  customerLastName: string;
  rateName: string;
  rateValidity: string;
  trainerFirstName: string;
  trainerLastName: string;
  start: Date;
  end: Date;
  isRegular: number;
  isFreeze: number;
  freezeStartDate: Date;
  freezeEndDate: Date;
  cancelled_date: Date;
  status: string;
  picture: string;
}

interface CheckIn {
  date: Date;
  timeIn: string;
}
