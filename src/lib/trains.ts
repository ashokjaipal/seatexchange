import type { TravelClass } from "./types";

export type TrainType =
  | "Rajdhani"
  | "Shatabdi"
  | "Vande Bharat"
  | "Duronto"
  | "Garib Rath"
  | "Tejas"
  | "Jan Shatabdi"
  | "Superfast"
  | "Express";

export interface Train {
  no: string;
  name: string;
  from: { code: string; name: string };
  to: { code: string; name: string };
  dep: string; // HH:MM at origin
  dur: string; // approx duration
  classes: TravelClass[];
  type: TrainType;
}

const S = {
  NDLS: "New Delhi",
  NZM: "Hazrat Nizamuddin",
  ANVT: "Anand Vihar Terminal",
  DEE: "Delhi Sarai Rohilla",
  DLI: "Old Delhi",
  MMCT: "Mumbai Central",
  CSMT: "Mumbai CSMT",
  BDTS: "Bandra Terminus",
  LTT: "Lokmanya Tilak Terminus",
  DR: "Dadar",
  HWH: "Howrah",
  SDAH: "Sealdah",
  SHM: "Shalimar",
  MAS: "Chennai Central",
  MS: "Chennai Egmore",
  SBC: "KSR Bengaluru",
  YPR: "Yesvantpur",
  SMVB: "SMVT Bengaluru",
  SC: "Secunderabad",
  HYB: "Hyderabad Deccan",
  ADI: "Ahmedabad",
  GNC: "Gandhinagar Capital",
  RKMP: "Rani Kamalapati (Bhopal)",
  BSB: "Varanasi",
  SVDK: "SMVD Katra",
  JAT: "Jammu Tawi",
  ASR: "Amritsar",
  KLK: "Kalka",
  DDN: "Dehradun",
  KGM: "Kathgodam",
  AII: "Ajmer",
  DEC: "Delhi Cantt",
  UDZ: "Udaipur City",
  JU: "Jodhpur",
  INDB: "Indore",
  JBP: "Jabalpur",
  BSP: "Bilaspur",
  PUNE: "Pune",
  MAO: "Madgaon",
  KRMI: "Karmali",
  SUR: "Solapur",
  TVC: "Thiruvananthapuram Central",
  KCVL: "Kochuveli",
  ERS: "Ernakulam Jn",
  CAN: "Kannur",
  MYS: "Mysuru",
  VSKP: "Visakhapatnam",
  PURI: "Puri",
  RNC: "Ranchi",
  HTE: "Hatia",
  PNBE: "Patna",
  RJPB: "Rajendra Nagar (Patna)",
  DNR: "Danapur",
  PPTA: "Patliputra",
  GAYA: "Gaya",
  MFP: "Muzaffarpur",
  DBG: "Darbhanga",
  SHC: "Saharsa",
  JYG: "Jaynagar",
  RGD: "Rajgir",
  PRYJ: "Prayagraj",
  DBRG: "Dibrugarh",
  NJP: "New Jalpaiguri",
  FZR: "Firozpur",
  YNRK: "Yog Nagari Rishikesh",
} as const;

type Code = keyof typeof S;
const st = (code: Code) => ({ code, name: S[code] });

const RAJ: TravelClass[] = ["1A", "2A", "3A"];
const RAJ3: TravelClass[] = ["2A", "3A"];
const SHAT: TravelClass[] = ["CC", "EC"];
const MAIL: TravelClass[] = ["1A", "2A", "3A", "SL"];
const EXP: TravelClass[] = ["2A", "3A", "SL"];
const EXP2S: TravelClass[] = ["2A", "3A", "SL", "2S"];

export const TRAINS: Train[] = [
  // Rajdhani
  { no: "12951", name: "Mumbai Rajdhani", from: st("MMCT"), to: st("NDLS"), dep: "17:00", dur: "15h 35m", classes: RAJ, type: "Rajdhani" },
  { no: "12952", name: "Mumbai Rajdhani", from: st("NDLS"), to: st("MMCT"), dep: "16:55", dur: "15h 40m", classes: RAJ, type: "Rajdhani" },
  { no: "12301", name: "Howrah Rajdhani", from: st("HWH"), to: st("NDLS"), dep: "16:50", dur: "17h 10m", classes: RAJ, type: "Rajdhani" },
  { no: "12302", name: "Howrah Rajdhani", from: st("NDLS"), to: st("HWH"), dep: "16:55", dur: "17h 05m", classes: RAJ, type: "Rajdhani" },
  { no: "12305", name: "Howrah Rajdhani (via Patna)", from: st("HWH"), to: st("NDLS"), dep: "14:05", dur: "21h 50m", classes: RAJ, type: "Rajdhani" },
  { no: "12313", name: "Sealdah Rajdhani", from: st("SDAH"), to: st("NDLS"), dep: "16:50", dur: "17h 20m", classes: RAJ, type: "Rajdhani" },
  { no: "12309", name: "Patna Rajdhani", from: st("RJPB"), to: st("NDLS"), dep: "19:20", dur: "12h 40m", classes: RAJ, type: "Rajdhani" },
  { no: "12310", name: "Patna Rajdhani", from: st("NDLS"), to: st("RJPB"), dep: "17:15", dur: "12h 45m", classes: RAJ, type: "Rajdhani" },
  { no: "12423", name: "Dibrugarh Rajdhani", from: st("DBRG"), to: st("NDLS"), dep: "20:35", dur: "38h 50m", classes: RAJ, type: "Rajdhani" },
  { no: "12425", name: "Jammu Tawi Rajdhani", from: st("JAT"), to: st("NDLS"), dep: "19:40", dur: "10h 30m", classes: RAJ, type: "Rajdhani" },
  { no: "12431", name: "Trivandrum Rajdhani", from: st("TVC"), to: st("NZM"), dep: "19:15", dur: "42h 20m", classes: RAJ, type: "Rajdhani" },
  { no: "12433", name: "Chennai Rajdhani", from: st("MAS"), to: st("NZM"), dep: "06:10", dur: "28h 10m", classes: RAJ, type: "Rajdhani" },
  { no: "12437", name: "Secunderabad Rajdhani", from: st("SC"), to: st("NZM"), dep: "12:45", dur: "21h 50m", classes: RAJ, type: "Rajdhani" },
  { no: "22691", name: "Bengaluru Rajdhani", from: st("SBC"), to: st("NZM"), dep: "20:00", dur: "33h 50m", classes: RAJ, type: "Rajdhani" },
  { no: "12957", name: "Swarna Jayanti Rajdhani", from: st("ADI"), to: st("NDLS"), dep: "17:40", dur: "14h 05m", classes: RAJ, type: "Rajdhani" },
  { no: "22221", name: "CSMT Rajdhani", from: st("CSMT"), to: st("NZM"), dep: "14:00", dur: "19h 55m", classes: RAJ, type: "Rajdhani" },

  // Shatabdi
  { no: "12001", name: "Bhopal Shatabdi", from: st("RKMP"), to: st("NDLS"), dep: "14:40", dur: "8h 05m", classes: SHAT, type: "Shatabdi" },
  { no: "12002", name: "Bhopal Shatabdi", from: st("NDLS"), to: st("RKMP"), dep: "06:00", dur: "8h 20m", classes: SHAT, type: "Shatabdi" },
  { no: "12009", name: "Mumbai-Ahmedabad Shatabdi", from: st("MMCT"), to: st("ADI"), dep: "06:25", dur: "6h 25m", classes: SHAT, type: "Shatabdi" },
  { no: "12010", name: "Ahmedabad-Mumbai Shatabdi", from: st("ADI"), to: st("MMCT"), dep: "14:40", dur: "6h 40m", classes: SHAT, type: "Shatabdi" },
  { no: "12011", name: "Kalka Shatabdi", from: st("NDLS"), to: st("KLK"), dep: "07:40", dur: "4h 05m", classes: SHAT, type: "Shatabdi" },
  { no: "12015", name: "Ajmer Shatabdi", from: st("NDLS"), to: st("AII"), dep: "06:10", dur: "6h 40m", classes: SHAT, type: "Shatabdi" },
  { no: "12017", name: "Dehradun Shatabdi", from: st("NDLS"), to: st("DDN"), dep: "06:45", dur: "6h 05m", classes: SHAT, type: "Shatabdi" },
  { no: "12019", name: "Howrah-Ranchi Shatabdi", from: st("HWH"), to: st("RNC"), dep: "06:05", dur: "7h 10m", classes: SHAT, type: "Shatabdi" },
  { no: "12027", name: "Bengaluru-Chennai Shatabdi", from: st("SBC"), to: st("MAS"), dep: "06:00", dur: "4h 55m", classes: SHAT, type: "Shatabdi" },
  { no: "12029", name: "Amritsar Swarna Shatabdi", from: st("NDLS"), to: st("ASR"), dep: "07:20", dur: "6h 05m", classes: SHAT, type: "Shatabdi" },
  { no: "12039", name: "Kathgodam Shatabdi", from: st("NDLS"), to: st("KGM"), dep: "06:20", dur: "5h 40m", classes: SHAT, type: "Shatabdi" },
  { no: "12007", name: "Chennai-Mysuru Shatabdi", from: st("MAS"), to: st("MYS"), dep: "06:00", dur: "7h 00m", classes: SHAT, type: "Shatabdi" },

  // Vande Bharat
  { no: "22435", name: "Varanasi Vande Bharat", from: st("NDLS"), to: st("BSB"), dep: "06:00", dur: "8h 00m", classes: SHAT, type: "Vande Bharat" },
  { no: "22436", name: "Varanasi Vande Bharat", from: st("BSB"), to: st("NDLS"), dep: "15:00", dur: "8h 00m", classes: SHAT, type: "Vande Bharat" },
  { no: "22439", name: "Katra Vande Bharat", from: st("NDLS"), to: st("SVDK"), dep: "06:00", dur: "8h 00m", classes: SHAT, type: "Vande Bharat" },
  { no: "20901", name: "Gandhinagar Vande Bharat", from: st("MMCT"), to: st("GNC"), dep: "06:10", dur: "6h 25m", classes: SHAT, type: "Vande Bharat" },
  { no: "20902", name: "Gandhinagar Vande Bharat", from: st("GNC"), to: st("MMCT"), dep: "14:05", dur: "6h 20m", classes: SHAT, type: "Vande Bharat" },
  { no: "22229", name: "Madgaon Vande Bharat", from: st("CSMT"), to: st("MAO"), dep: "05:25", dur: "7h 50m", classes: SHAT, type: "Vande Bharat" },
  { no: "22225", name: "Solapur Vande Bharat", from: st("CSMT"), to: st("SUR"), dep: "16:05", dur: "6h 35m", classes: SHAT, type: "Vande Bharat" },
  { no: "20607", name: "Mysuru Vande Bharat", from: st("MAS"), to: st("MYS"), dep: "05:50", dur: "6h 30m", classes: SHAT, type: "Vande Bharat" },
  { no: "22301", name: "NJP Vande Bharat", from: st("HWH"), to: st("NJP"), dep: "05:55", dur: "7h 30m", classes: SHAT, type: "Vande Bharat" },
  { no: "22347", name: "Patna-Ranchi Vande Bharat", from: st("PNBE"), to: st("RNC"), dep: "07:00", dur: "6h 05m", classes: SHAT, type: "Vande Bharat" },
  { no: "20171", name: "Bhopal-Delhi Vande Bharat", from: st("RKMP"), to: st("NZM"), dep: "05:40", dur: "7h 30m", classes: SHAT, type: "Vande Bharat" },
  { no: "20833", name: "Vizag-Secunderabad Vande Bharat", from: st("VSKP"), to: st("SC"), dep: "05:45", dur: "8h 30m", classes: SHAT, type: "Vande Bharat" },
  { no: "20977", name: "Ajmer-Delhi Vande Bharat", from: st("AII"), to: st("DEC"), dep: "06:20", dur: "5h 15m", classes: SHAT, type: "Vande Bharat" },

  // Duronto / Garib Rath / Tejas
  { no: "12259", name: "Sealdah Duronto", from: st("SDAH"), to: st("NDLS"), dep: "18:25", dur: "17h 00m", classes: RAJ, type: "Duronto" },
  { no: "12213", name: "Yesvantpur Duronto", from: st("YPR"), to: st("DEE"), dep: "19:45", dur: "34h 10m", classes: RAJ, type: "Duronto" },
  { no: "12245", name: "Howrah-Yesvantpur Duronto", from: st("HWH"), to: st("YPR"), dep: "10:50", dur: "28h 10m", classes: RAJ, type: "Duronto" },
  { no: "12267", name: "Ahmedabad Duronto", from: st("MMCT"), to: st("ADI"), dep: "23:25", dur: "6h 25m", classes: RAJ, type: "Duronto" },
  { no: "12227", name: "Indore Duronto", from: st("MMCT"), to: st("INDB"), dep: "23:00", dur: "12h 20m", classes: RAJ, type: "Duronto" },
  { no: "12269", name: "Chennai Duronto", from: st("MAS"), to: st("NZM"), dep: "06:40", dur: "27h 45m", classes: RAJ, type: "Duronto" },
  { no: "12283", name: "Ernakulam Duronto", from: st("ERS"), to: st("NZM"), dep: "20:40", dur: "38h 30m", classes: RAJ, type: "Duronto" },
  { no: "12223", name: "LTT-Ernakulam Duronto", from: st("LTT"), to: st("ERS"), dep: "20:25", dur: "24h 20m", classes: EXP, type: "Duronto" },
  { no: "12285", name: "Secunderabad Duronto", from: st("SC"), to: st("NZM"), dep: "19:30", dur: "21h 55m", classes: RAJ, type: "Duronto" },
  { no: "12909", name: "Bandra Garib Rath", from: st("BDTS"), to: st("NZM"), dep: "17:20", dur: "16h 35m", classes: ["3A"], type: "Garib Rath" },
  { no: "12611", name: "Chennai Garib Rath", from: st("MAS"), to: st("NZM"), dep: "06:40", dur: "31h 45m", classes: ["3A"], type: "Garib Rath" },
  { no: "22119", name: "Karmali Tejas", from: st("CSMT"), to: st("KRMI"), dep: "05:50", dur: "8h 30m", classes: SHAT, type: "Tejas" },
  { no: "12081", name: "Kannur Jan Shatabdi", from: st("KCVL"), to: st("CAN"), dep: "05:15", dur: "9h 25m", classes: ["CC", "2S"], type: "Jan Shatabdi" },

  // Long distance mail / express
  { no: "12621", name: "Tamil Nadu Express", from: st("MAS"), to: st("NDLS"), dep: "22:00", dur: "33h 10m", classes: MAIL, type: "Superfast" },
  { no: "12622", name: "Tamil Nadu Express", from: st("NDLS"), to: st("MAS"), dep: "22:30", dur: "33h 05m", classes: MAIL, type: "Superfast" },
  { no: "12723", name: "Telangana Express", from: st("HYB"), to: st("NDLS"), dep: "06:25", dur: "26h 30m", classes: MAIL, type: "Superfast" },
  { no: "12627", name: "Karnataka Express", from: st("SBC"), to: st("NDLS"), dep: "19:20", dur: "40h 50m", classes: MAIL, type: "Superfast" },
  { no: "12615", name: "Grand Trunk Express", from: st("MAS"), to: st("NDLS"), dep: "19:15", dur: "35h 25m", classes: MAIL, type: "Superfast" },
  { no: "12137", name: "Punjab Mail", from: st("CSMT"), to: st("FZR"), dep: "19:35", dur: "34h 15m", classes: MAIL, type: "Superfast" },
  { no: "12809", name: "Mumbai-Howrah Mail", from: st("CSMT"), to: st("HWH"), dep: "20:35", dur: "32h 45m", classes: MAIL, type: "Superfast" },
  { no: "12859", name: "Gitanjali Express", from: st("CSMT"), to: st("HWH"), dep: "06:00", dur: "30h 30m", classes: EXP, type: "Superfast" },
  { no: "12841", name: "Coromandel Express", from: st("SHM"), to: st("MAS"), dep: "15:20", dur: "26h 15m", classes: MAIL, type: "Superfast" },
  { no: "12839", name: "Howrah-Chennai Mail", from: st("HWH"), to: st("MAS"), dep: "23:45", dur: "27h 25m", classes: MAIL, type: "Superfast" },
  { no: "12801", name: "Purushottam Express", from: st("PURI"), to: st("NDLS"), dep: "21:55", dur: "31h 05m", classes: EXP, type: "Superfast" },
  { no: "12417", name: "Prayagraj Express", from: st("PRYJ"), to: st("NDLS"), dep: "21:30", dur: "8h 30m", classes: MAIL, type: "Superfast" },
  { no: "12303", name: "Poorva Express", from: st("HWH"), to: st("NDLS"), dep: "08:00", dur: "22h 30m", classes: EXP, type: "Superfast" },
  { no: "12295", name: "Sanghamitra Express", from: st("SMVB"), to: st("DNR"), dep: "09:00", dur: "44h 05m", classes: EXP, type: "Superfast" },
  { no: "12163", name: "LTT-Chennai Egmore Express", from: st("LTT"), to: st("MS"), dep: "20:30", dur: "23h 30m", classes: EXP, type: "Superfast" },
  { no: "12625", name: "Kerala Express", from: st("TVC"), to: st("NDLS"), dep: "11:15", dur: "50h 05m", classes: EXP, type: "Superfast" },
  { no: "12617", name: "Mangala Lakshadweep Express", from: st("ERS"), to: st("NZM"), dep: "13:15", dur: "47h 40m", classes: EXP, type: "Superfast" },
  { no: "12553", name: "Vaishali Express", from: st("SHC"), to: st("NDLS"), dep: "10:10", dur: "22h 20m", classes: MAIL, type: "Superfast" },
  { no: "12565", name: "Bihar Sampark Kranti", from: st("DBG"), to: st("NDLS"), dep: "08:25", dur: "21h 40m", classes: EXP, type: "Superfast" },
  { no: "12557", name: "Sapt Kranti Express", from: st("MFP"), to: st("ANVT"), dep: "13:50", dur: "16h 05m", classes: EXP, type: "Superfast" },
  { no: "12391", name: "Shramjeevi Express", from: st("RGD"), to: st("NDLS"), dep: "08:10", dur: "19h 50m", classes: EXP, type: "Superfast" },
  { no: "12559", name: "Shiv Ganga Express", from: st("BSB"), to: st("NDLS"), dep: "19:00", dur: "12h 40m", classes: MAIL, type: "Superfast" },
  { no: "12561", name: "Swatantrata Senani Express", from: st("JYG"), to: st("NDLS"), dep: "09:10", dur: "24h 30m", classes: EXP, type: "Superfast" },
  { no: "12393", name: "Sampoorna Kranti Express", from: st("RJPB"), to: st("NDLS"), dep: "17:30", dur: "13h 15m", classes: EXP, type: "Superfast" },
  { no: "12397", name: "Mahabodhi Express", from: st("GAYA"), to: st("NDLS"), dep: "14:10", dur: "16h 25m", classes: EXP, type: "Superfast" },
  { no: "12311", name: "Netaji Express (Kalka Mail)", from: st("HWH"), to: st("KLK"), dep: "19:40", dur: "31h 50m", classes: MAIL, type: "Superfast" },
  { no: "12321", name: "Howrah-Mumbai Mail (via Prayagraj)", from: st("HWH"), to: st("CSMT"), dep: "22:00", dur: "36h 05m", classes: EXP2S, type: "Express" },
  { no: "12129", name: "Azad Hind Express", from: st("PUNE"), to: st("HWH"), dep: "18:35", dur: "34h 20m", classes: EXP, type: "Superfast" },
  { no: "11077", name: "Jhelum Express", from: st("PUNE"), to: st("JAT"), dep: "17:20", dur: "39h 30m", classes: EXP2S, type: "Express" },
  { no: "12471", name: "Swaraj Express", from: st("BDTS"), to: st("SVDK"), dep: "07:55", dur: "31h 05m", classes: EXP, type: "Superfast" },
  { no: "12925", name: "Paschim Express", from: st("BDTS"), to: st("ASR"), dep: "11:35", dur: "31h 20m", classes: MAIL, type: "Superfast" },
  { no: "12903", name: "Golden Temple Mail", from: st("MMCT"), to: st("ASR"), dep: "21:25", dur: "31h 50m", classes: MAIL, type: "Superfast" },
  { no: "12907", name: "Maharashtra Sampark Kranti", from: st("BDTS"), to: st("NZM"), dep: "17:15", dur: "16h 40m", classes: EXP, type: "Superfast" },
  { no: "12649", name: "Karnataka Sampark Kranti", from: st("YPR"), to: st("NZM"), dep: "06:30", dur: "36h 30m", classes: EXP, type: "Superfast" },
  { no: "12155", name: "Shan-e-Bhopal Express", from: st("RKMP"), to: st("NZM"), dep: "21:00", dur: "10h 25m", classes: MAIL, type: "Superfast" },
  { no: "12191", name: "Shridham Express", from: st("JBP"), to: st("NZM"), dep: "15:40", dur: "16h 55m", classes: EXP, type: "Superfast" },
  { no: "12405", name: "Gondwana Express", from: st("BSP"), to: st("NZM"), dep: "12:00", dur: "26h 35m", classes: EXP, type: "Superfast" },
  { no: "12833", name: "Howrah-Ahmedabad Express", from: st("HWH"), to: st("ADI"), dep: "23:55", dur: "34h 55m", classes: EXP, type: "Superfast" },
  { no: "12963", name: "Mewar Express", from: st("NZM"), to: st("UDZ"), dep: "19:05", dur: "12h 30m", classes: MAIL, type: "Superfast" },
  { no: "12461", name: "Mandore Express", from: st("DLI"), to: st("JU"), dep: "20:15", dur: "11h 35m", classes: EXP, type: "Superfast" },
  { no: "12961", name: "Avantika Express", from: st("MMCT"), to: st("INDB"), dep: "19:15", dur: "14h 05m", classes: MAIL, type: "Superfast" },
  { no: "12655", name: "Navjeevan Express", from: st("MAS"), to: st("ADI"), dep: "06:10", dur: "34h 00m", classes: EXP, type: "Superfast" },
  { no: "12727", name: "Godavari Express", from: st("VSKP"), to: st("HYB"), dep: "17:15", dur: "12h 20m", classes: MAIL, type: "Superfast" },
  { no: "12703", name: "Falaknuma Express", from: st("HWH"), to: st("SC"), dep: "07:25", dur: "26h 10m", classes: EXP, type: "Superfast" },
  { no: "12639", name: "Brindavan Express", from: st("MAS"), to: st("SBC"), dep: "07:50", dur: "5h 55m", classes: ["CC", "2S"], type: "Superfast" },
  { no: "12658", name: "Bengaluru-Chennai Mail", from: st("SBC"), to: st("MAS"), dep: "22:40", dur: "6h 35m", classes: MAIL, type: "Superfast" },
  { no: "16526", name: "Island Express", from: st("SBC"), to: st("KCVL"), dep: "21:20", dur: "17h 55m", classes: EXP, type: "Express" },
  { no: "12817", name: "Jharkhand Swarna Jayanti", from: st("HTE"), to: st("ANVT"), dep: "15:40", dur: "21h 15m", classes: EXP, type: "Superfast" },
  { no: "12875", name: "Neelachal Express", from: st("PURI"), to: st("ANVT"), dep: "08:10", dur: "31h 35m", classes: EXP, type: "Superfast" },
  { no: "18477", name: "Kalinga Utkal Express", from: st("PURI"), to: st("YNRK"), dep: "20:35", dur: "40h 55m", classes: EXP2S, type: "Express" },
  { no: "12141", name: "LTT-Patliputra Express", from: st("LTT"), to: st("PPTA"), dep: "23:30", dur: "29h 30m", classes: EXP, type: "Superfast" },
  { no: "11061", name: "Pawan Express", from: st("LTT"), to: st("JYG"), dep: "12:15", dur: "34h 30m", classes: EXP2S, type: "Express" },
  { no: "12297", name: "Pune-Ahmedabad Duronto", from: st("PUNE"), to: st("ADI"), dep: "22:20", dur: "11h 15m", classes: RAJ3, type: "Duronto" },
];

const byNo = new Map(TRAINS.map((t) => [t.no, t]));

export function getTrain(no: string): Train | undefined {
  return byNo.get(no.trim());
}

/** Popular picks for the landing page */
export const POPULAR_TRAIN_NOS = ["12951", "12301", "22435", "12621", "12009", "20901"];

export function searchTrains(q: string, limit = 8): Train[] {
  const query = q.trim().toLowerCase();
  if (!query) return [];
  const isNumeric = /^\d+$/.test(query);
  const scored: { t: Train; s: number }[] = [];
  for (const t of TRAINS) {
    let s = 0;
    if (isNumeric) {
      if (t.no === query) s = 100;
      else if (t.no.startsWith(query)) s = 60;
      else if (t.no.includes(query)) s = 20;
    } else {
      const name = t.name.toLowerCase();
      const route = `${t.from.name} ${t.from.code} ${t.to.name} ${t.to.code}`.toLowerCase();
      if (name.startsWith(query)) s = 80;
      else if (name.includes(query)) s = 50;
      else if (route.includes(query)) s = 30;
      else if (query.split(/\s+/).every((w) => name.includes(w) || route.includes(w))) s = 25;
    }
    if (s > 0) scored.push({ t, s });
  }
  return scored
    .sort((a, b) => b.s - a.s || a.t.no.localeCompare(b.t.no))
    .slice(0, limit)
    .map((x) => x.t);
}
