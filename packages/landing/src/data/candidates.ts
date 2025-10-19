export type Candidate = {
  id: string;
  name: string;
  role: string; // puesto que buscan
  party: string;
  bio: string;
  avatar?: string; // opcional
  tags?: string[];
};

export const candidates: Candidate[] = [
  {
    id: "c1",
    name: "Mariana Solís",
    role: "Alcaldía",
    party: "Futuro Local",
    bio: "Economista, 10 años en gestión pública. Agenda de transparencia y movilidad.",
    tags: ["Transparencia", "Movilidad", "Datos abiertos"],
  },
  {
    id: "c2",
    name: "Diego Araya",
    role: "Vicealcaldía",
    party: "Futuro Local",
    bio: "Ingeniero civil. Prioriza infraestructura resiliente y espacios verdes.",
    tags: ["Infraestructura", "Sostenibilidad"],
  },
  {
    id: "c3",
    name: "Valeria Castro",
    role: "Consejo Municipal",
    party: "Comunidad Viva",
    bio: "Comunicadora. Agenda juvenil y participación ciudadana digital.",
    tags: ["Juventud", "Participación"],
  },
  {
    id: "c4",
    name: "Julián Méndez",
    role: "Consejo Municipal",
    party: "Comunidad Viva",
    bio: "Abogado. Enfoque en simplificación de trámites y servicio al ciudadano.",
    tags: ["Simplificación", "Servicio"],
  },
  {
    id: "c5",
    name: "Laura Hernández",
    role: "Síndica",
    party: "Alianza Vecinal",
    bio: "Trabajadora social. Programas de apoyo a emprendimientos locales.",
    tags: ["Emprendimiento", "Equidad"],
  },
  {
    id: "c6",
    name: "Gabriel Rojas",
    role: "Síndico suplente",
    party: "Alianza Vecinal",
    bio: "Ambientalista. Gestiona proyectos de reciclaje y energía limpia.",
    tags: ["Reciclaje", "Energía"],
  },
];
