export interface Client {
  id: string;
  /** Nombre y apellido en un unico campo, tal como lo captura el trabajador. */
  fullName: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
}