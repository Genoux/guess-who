/**
 * The small line under a person's name: their email, or, when the name already is the email, where
 * they came from. A later source (an import from Deel) is one more branch here.
 */
export function personSubline({ name, email }: { name: string | null; email: string }): string {
  return name === null ? "Invited by email" : email;
}
