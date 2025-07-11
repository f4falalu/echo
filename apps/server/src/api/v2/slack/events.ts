export async function eventsHandler(_body: unknown): Promise<{ success: boolean }> {
  // Simply accept any JSON payload and return success
  return { success: true };
}
