// Huella SHA-256 de un script en línea, en el formato de la política de contenido
// ("sha256-…"). Solo se usa al construir el sitio (Node), nunca en el navegador.
import { createHash } from "node:crypto";

export const huellaScript = (codigo: string): `sha256-${string}` => `sha256-${createHash("sha256").update(codigo).digest("base64")}`;
