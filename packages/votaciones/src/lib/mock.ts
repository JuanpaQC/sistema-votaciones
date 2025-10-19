export type Candidate = {
  id: string
  name: string
  subtitle?: string
  avatar?: string
}

export type Election = {
  id: string
  title: string
  dateRange: string
  candidates: Candidate[]
}

export const MOCK_ELECTIONS: Election[] = [
  {
    id: "tec-consejo-2025",
    title: "Consejo Estudiantil TEC 2025",
    dateRange: "10–12 Oct 2025",
    candidates: [
      { id: "c1", name: "María Fernández", subtitle: "Propuesta: Innovación y Becas", avatar: "https://i.pravatar.cc/120?img=5" },
      { id: "c2", name: "Carlos Rojas", subtitle: "Propuesta: Movilidad y Seguridad", avatar: "https://i.pravatar.cc/120?img=12" },
      { id: "c3", name: "Valeria Solís", subtitle: "Propuesta: Cultura y Deporte", avatar: "https://i.pravatar.cc/120?img=32" },
    ],
  },
]

export const CONFIRM_CODE = "123456"
