import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "sonner";

export default function App() {
  return (
    <div className="size-full">
      <Toaster position="top-center" />
      <RouterProvider router={router} />
    </div>
  );
}
