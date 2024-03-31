export function randomInt(min: number, max: number): number {
  // Generiere eine zufällige Gleitkommazahl zwischen min (inklusive) und max (exklusive)
  const randomFloat = Math.random() * (max - min) + min;
  // Runde die Gleitkommazahl auf die nächstkleinere Ganzzahl ab
  return Math.floor(randomFloat);
}
