import type { QueryError } from '../stores/tabStore'

/** Postgres errors people commonly hit while editing, said plainly. */
const MESSAGES: Record<string, string> = {
  '25006': 'This database is read-only (the demo database is), so the change was not saved.',
  '42501': 'Your role is not allowed to do this (permission denied), so the change was not saved.',
}

export function friendlyError(error: QueryError): string {
  return (error.code && MESSAGES[error.code]) || error.error
}
