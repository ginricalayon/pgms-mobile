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

interface TrainerDetails {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  rate: number;
}

interface TrainerRate {
  ptRateId: string;
  amount: number;
}

interface ScheduleDetails {
  scheduleDate: string;
  startTime: string;
  endTime: string;
}

interface RateDetails {
  rateId: string;
  name: string;
  cost: number;
  validity: string;
}

interface OrderSummary {
  rateName: string;
  rateValidity: string;
  rateCost: number;
  trainerName: string | null;
  schedules: ScheduleDetails[];
  total: number;
}

interface Schedule {
  ptScheduleId: string;
  ptId: string;
  scheduleDate: string;
  startTime: string;
  endTime: string;
}

interface Trainer {
  ptId: string;
  firstName: string;
  lastName: string;
  gender: string;
  address: string;
  phoneNumber: string;
  isAvailable: boolean;
}

interface Rate {
  rateId: string;
  name: string;
  cost: number;
  validityId: string;
  validity: string;
}

interface PersonalTrainerRate {
  ptRateId: string;
  validityId: string;
  amount: number;
  validity: string;
}

interface CheckIn {
  date: string;
  timeIn: string;
  timeOut?: string;
}

interface Schedule {
  ID: number;
  Day: string;
  StartTime: string;
  EndTime: string;
}

interface TrainerInfo {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

interface Transaction {
  transactionId: string;
  rateName: string;
  rateAmount: number;
  paymentType: string;
  totalCost: number;
  date: string;
}
