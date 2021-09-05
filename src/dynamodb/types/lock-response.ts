export interface LockResponse {
  id: string | null,
  owner?: string,
  try?: number,
}
