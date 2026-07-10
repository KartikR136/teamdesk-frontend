export async function checkHealth() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}
