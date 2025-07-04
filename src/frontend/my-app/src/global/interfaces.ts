export interface UserData {
  age: number;
  banned: boolean;
  bannedTime: string | null;
  caseBronza: number;
  caseEveryDay: number;
  caseGold: number;
  caseMystery: number;
  casePlatinum: number;
  caseSilver: number;
  city: string;
  coin: number;
  coinWieved: boolean;
  description: string;
  dislike: number;
  dislikeWieved: boolean;
  gender: boolean;
  id: string;
  idPrisma: number;
  lat: number;
  like: number;
  likeWieved: boolean;
  long: number;
  maxAge: number;
  minAge: number;
  name: string;
  photo: string;
  premium: boolean;
  premiumTime: string | null;
  reported: number;
  role: "user" | "admin";
  searchGender: boolean;
  shutdown: boolean;
  top: number;
  photoMiniApp: string
}

export interface Statistic {
  text: number | string,
  icon: any
}

export interface Cases {
  count: number | string,
  text: string,
  type: string,
  typeCase: string
}
