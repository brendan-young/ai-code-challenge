import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import ChatPage from "./pages/ChatPage";
import ConfigurePage from "./pages/ConfigurePage";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-950 text-slate-50">
      <nav className="flex flex-col gap-3 border-b border-slate-600/40 bg-slate-900/80 px-6 py-4 backdrop-blur md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold">Legal frontdoor</h2>
        <div className="flex gap-2">
          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-semibold transition ${
                isActive ? "bg-sky-500 text-slate-950" : "text-slate-100 hover:bg-slate-700/60"
              }`
            }
          >
            Chat
          </NavLink>
          <NavLink
            to="/configure"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-semibold transition ${
                isActive ? "bg-sky-500 text-slate-950" : "text-slate-100 hover:bg-slate-700/60"
              }`
            }
          >
            Configure
          </NavLink>
        </div>
      </nav>

      <main className="flex flex-1 flex-col px-6 py-6 md:px-10">
        <Routes>
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/configure" element={<ConfigurePage />} />
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </main>
      <ToastContainer position="bottom-right" newestOnTop closeOnClick pauseOnFocusLoss />
    </div>
  );
}
