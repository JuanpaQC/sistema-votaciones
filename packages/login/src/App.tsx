import { LoginForm } from "./components/LoginForm"

export default function App() {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-gradient-to-b from-[#f8fafc] to-white">
      {/* Columna formulario */}
      <div className="flex items-center justify-center px-6 sm:px-12">
        <LoginForm />
      </div>
    </div>
  )
}
