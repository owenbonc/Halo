import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { reserveBudget } from './budget';
import { collections, ensureIndexes, transaction } from './db';
import { HttpError, handle, sameOrigin } from './http';
import { Device, DeviceRole, Invitation } from './server-schemas';
import { household } from './settings-store';

export const SESSION_SECONDS = 8 * 60 * 60;
export const cookieName = () =>
  process.env.NODE_ENV === 'production' ? '__Host-halo-session' : 'halo-session';
export const hash = (value: string | Uint8Array) =>
  createHash('sha256').update(value).digest('hex');
export const cookie = (token: string, seconds = SESSION_SECONDS) =>
  `${cookieName()}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;

function tokenFrom(request: Request): string | null {
  const token = request.headers
    .get('cookie')
    ?.split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${cookieName()}=`))
    ?.slice(cookieName().length + 1);
  return token && /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
}

export async function requireDevice(request: Request, roles: Device['role'][]): Promise<Device> {
  const token = tokenFrom(request);
  if (!token) throw new HttpError(401, 'Connect this phone to continue.');
  const { devices } = await collections();
  const found = await devices.findOne({ tokenHash: hash(token), expiresAt: { $gt: new Date() } });
  if (!found) throw new HttpError(401, 'This phone is disconnected. Connect it again.');
  const device = Device.parse(found);
  if (!roles.includes(device.role))
    throw new HttpError(403, 'This phone cannot perform that action.');
  if (device.role === 'caretaker' && device.recipientId !== (await household()).recipientId)
    throw new HttpError(401, 'This invitation is no longer valid.');
  return device;
}

export function api(
  request: Request,
  roles: Device['role'][],
  work: (device: Device) => Promise<Response>,
) {
  return handle(async () => {
    sameOrigin(request);
    return work(await requireDevice(request, roles));
  });
}

export const SessionInput = z.object({
  role: DeviceRole,
  code: z.string().min(1).max(256),
  name: z.string().trim().min(1).max(40),
});

export async function connectDevice(input: z.infer<typeof SessionInput>, now = Date.now()) {
  await reserveBudget('auth', now);
  await ensureIndexes();
  const token = randomBytes(32).toString('base64url');
  const device: Device = {
    id: crypto.randomUUID(),
    tokenHash: hash(token),
    name: input.name,
    role: input.role,
    recipientId: null,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_SECONDS * 1000),
  };
  const { devices, invitations, settings } = await collections();
  if (input.role !== 'caretaker') {
    const configured =
      process.env[input.role === 'grandma' ? 'ELDER_DEMO_ACCESS_CODE' : 'CALL_DEMO_ACCESS_CODE'];
    if (!configured || configured.length < 16 || configured.length > 256)
      throw new HttpError(503, 'Private demo access is not configured.');
    if (!timingSafeEqual(Buffer.from(hash(input.code)), Buffer.from(hash(configured))))
      throw new HttpError(401, 'That access code was not accepted.');
    await devices.insertOne(device);
  } else {
    const code = input.code.replace(/[\s-]/g, '').toUpperCase();
    if (!/^[A-Z]{12}$/.test(code)) throw new HttpError(401, 'That invitation was not accepted.');
    await transaction(async (session) => {
      const current = await household(session, true);
      const invitation = await invitations.findOneAndDelete(
        { _id: hash(code), expiresAt: { $gt: new Date(now) }, recipientId: current.recipientId },
        { session },
      );
      if (!invitation) throw new HttpError(401, 'That invitation expired or was already used.');
      Invitation.parse(invitation);
      device.recipientId = current.recipientId;
      await devices.insertOne({ ...device }, { session });
      await settings.updateOne(
        { id: 'household' },
        { $set: { 'contact.verified': true }, $inc: { revision: 1 } },
        { session },
      );
    });
  }
  return { token, device };
}

export async function inviteCaretaker(ownerId: string, now = Date.now()) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const code = Array.from({ length: 12 }, () => alphabet[randomInt(alphabet.length)]).join('');
  const expiresAt = new Date(now + 10 * 60_000);
  await transaction(async (session) => {
    const { devices, invitations } = await collections();
    if (
      !(await devices.findOne(
        { id: ownerId, role: 'grandma', expiresAt: { $gt: new Date(now) } },
        { session },
      ))
    )
      throw new HttpError(401, 'Connect this phone again.');
    const current = await household(session, true);
    // Only the newest code is usable, so old screenshots cannot add another phone.
    await invitations.deleteMany({}, { session });
    await invitations.insertOne(
      { _id: hash(code), recipientId: current.recipientId, expiresAt },
      { session },
    );
  });
  return { code: code.match(/.{4}/g)?.join('-'), expiresAt: expiresAt.toISOString() };
}

export async function revokeDevice(id: string, ownerId: string) {
  await transaction(async (session) => {
    const { devices, settings } = await collections();
    if (
      !(await devices.findOne(
        { id: ownerId, role: 'grandma', expiresAt: { $gt: new Date() } },
        { session },
      ))
    )
      throw new HttpError(401, 'Connect this phone again.');
    const current = await household(session, true);
    await devices.deleteOne(
      { id, role: 'caretaker', recipientId: current.recipientId },
      { session },
    );
    const remaining = await devices.countDocuments(
      { role: 'caretaker', recipientId: current.recipientId, expiresAt: { $gt: new Date() } },
      { session },
    );
    await settings.updateOne(
      { id: 'household' },
      { $set: { 'contact.verified': remaining > 0 }, $inc: { revision: 1 } },
      { session },
    );
  });
}
