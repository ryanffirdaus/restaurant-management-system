import { useAuth } from "../../context/AuthContext"
import LoginForm from "./components/LoginForm"

function LoginPage() {
  const { login } = useAuth()
  return <LoginForm onLogin={login} />
}

export default LoginPage
