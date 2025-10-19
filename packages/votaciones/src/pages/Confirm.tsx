import { useLocation, useNavigate, useParams } from "react-router-dom"
import CodeInput from "../components/verify/CodeInput"
import { Button } from "../components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card"
import { useState } from "react"
import { CONFIRM_CODE } from "../lib/mock"

export default function Confirm() {
  const { electionId } = useParams()
  const nav = useNavigate()
  const { state } = useLocation() as { state?: { candidateId?: string } }
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError(null)
    setLoading(true)
    await new Promise((r) => setTimeout(r, 700))
    if (code === CONFIRM_CODE) {
      nav(`/e/${electionId}/receipt`, { state: { ok: true } })
    } else {
      setError("Código inválido. Intenta nuevamente.")
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirmación</CardTitle>
        <CardDescription>Ingresa el código de verificación (demo: <strong>123456</strong>).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CodeInput onComplete={setCode} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button variant="gradient" fullWidth onClick={submit} loading={loading}>
          Confirmar voto
        </Button>
      </CardContent>
    </Card>
  )
}
