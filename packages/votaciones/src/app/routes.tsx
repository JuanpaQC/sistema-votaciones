import { createBrowserRouter } from "react-router-dom"
import AppShell from "./AppShell"
import SelectElection from "../pages/SelectElection"
import Ballot from "../pages/Ballot"
import Confirm from "../pages/Confirm"
import Receipt from "../pages/Receipt"
import NotFound from "../pages/NotFound"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <SelectElection /> },
      { path: "e/:electionId/ballot", element: <Ballot /> },
      { path: "e/:electionId/confirm", element: <Confirm /> },
      { path: "e/:electionId/receipt", element: <Receipt /> },
      { path: "*", element: <NotFound /> },
    ],
  },
])
