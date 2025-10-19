import { Link, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card"
import { Button } from "../components/ui/Button"
import { MOCK_ELECTIONS } from "../lib/mock"
import { useEffect } from "react"

type SessionShape = {
  email?: string;
  password?: string;
  role?: "voter" | "admin";
  hasVoted?: boolean;
  remember?: boolean;
};

export default function SelectElection() {
  // Al cargar la página, verificar si hay datos de sesión en la URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedSessionData = urlParams.get('sessionData');
    
    if (encodedSessionData) {
      try {
        // Decodificar los datos de sesión
        const sessionData: SessionShape = JSON.parse(atob(encodedSessionData));
        
        // Guardar en el storage apropiado
        const payload = JSON.stringify(sessionData);
        if (sessionData.remember) {
          localStorage.setItem("session", payload);
        } else {
          sessionStorage.setItem("session", payload);
        }
        
        // Limpiar la URL para que no se vea fea
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        console.log('Sesión restaurada desde URL:', sessionData.email);
      } catch (error) {
        console.error('Error al procesar datos de sesión desde URL:', error);
      }
    }
  }, []);
  const nav = useNavigate()
  useEffect(() => {
    if (MOCK_ELECTIONS.length === 1) {
      nav(`/e/${MOCK_ELECTIONS[0].id}/ballot`, { replace: true })
    }
  }, [])
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Elecciones disponibles</h1>
        <p className="text-sm text-muted-foreground">Selecciona una elección para emitir tu voto.</p>
      </div>
      <div className="grid gap-4">
        {MOCK_ELECTIONS.map((e) => (
          <Card key={e.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{e.title}</CardTitle>
              <CardDescription>{e.dateRange}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to={`/e/${e.id}/ballot`}>
                <Button>Comenzar</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
