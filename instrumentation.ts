export async function register() {
  // Only run on the server side (not in edge runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initDb } = await import("./lib/init-db");
    initDb();
  }
}
