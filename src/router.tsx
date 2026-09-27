import { createBrowserRouter } from "react-router"
import Home from "./App"
import Contact from "./pages/Contact"

export const router = createBrowserRouter([
  { path: "/", Component: Home },
  { path: "/contact", Component: Contact },
])
