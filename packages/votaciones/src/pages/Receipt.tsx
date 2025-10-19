import { useLocation, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card"
import { Button } from "../components/ui/Button"

export default function Receipt() {
  const nav = useNavigate()
  const { state } = useLocation() as { state?: { ok?: boolean } }

  return (
    <Card className="text-center">
      <CardHeader>
        <CardTitle>¡Voto registrado!</CardTitle>
        <CardDescription>Este es tu comprobante de emisión (demo).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Folio: <strong>TEC-{Math.floor(Math.random()*999999)}</strong></p>
        <p className="text-sm text-muted-foreground">Fecha: {new Date().toLocaleString()}</p>
        <div className="pt-2">
          <Button fullWidth onClick={() => nav("/")}>Volver al inicio</Button>
        </div>
      </CardContent>
    </Card>
  )
}
