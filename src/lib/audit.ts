import { db } from './db';

interface AuditParams {
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  module: string;
  details?: Record<string, unknown> | string | null;
  ipAddress?: string | null;
}

export async function logAudit({
  userId,
  userName,
  userEmail,
  action,
  module,
  details,
  ipAddress,
}: AuditParams) {
  try {
    await db.auditLog.create({
      data: {
        userId,
        userName,
        userEmail,
        action,
        module,
        details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error('Error writing audit log:', error);
  }
}

export function getClientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}
