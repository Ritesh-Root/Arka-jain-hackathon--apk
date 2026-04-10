import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./components/Home";
import { Profile } from "./components/Profile";
import { QRCardPage } from "./components/QRCard";
import { PublicProfile } from "./components/PublicProfile";
import { HospitalMap } from "./components/HospitalMap";
import { EyeWitness } from "./components/EyeWitness";
import { VitalSigns } from "./components/VitalSigns";
import { Copilot } from "./components/Copilot";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "profile", Component: Profile },
      { path: "qr", Component: QRCardPage },
      { path: "hospitals", Component: HospitalMap },
      { path: "witness", Component: EyeWitness },
      { path: "scan", Component: VitalSigns },
      { path: "vitals", Component: VitalSigns },
      { path: "copilot", Component: Copilot },
    ],
  },
  { path: "/q/:token", Component: PublicProfile },
]);
