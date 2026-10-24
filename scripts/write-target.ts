export function checkWriteTarget(
  uri: string | undefined,
  database: string,
  confirmation: string | undefined,
) {
  if (!uri) throw new Error('MONGODB_URI is required.');
  let hostname: string;
  try {
    hostname = new URL(uri).hostname;
  } catch {
    throw new Error('Invalid MongoDB URI.');
  }
  const target = `${hostname}/${database}`;
  if (!['localhost', '127.0.0.1', '[::1]'].includes(hostname) && confirmation !== target)
    throw new Error(
      `Remote data replacement requires CONFIRM_DEMO_TARGET=${target}. Check the host and database first.`,
    );
  return target;
}
