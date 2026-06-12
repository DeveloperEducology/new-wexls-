import { getMongoDb } from './db/mongo';

/**
 * Creates a system audit log entry in the audit_logs collection.
 * 
 * @param {object} params
 * @param {string} params.actorUserId - User ID performing the action
 * @param {string} params.actorRole - Role of the actor (student, parent, teacher, admin, etc.)
 * @param {string} params.action - Action performed (login, failed login, logout, user create, reset pin, etc.)
 * @param {string} [params.targetType] - Target entity type (user, class, links, report)
 * @param {string} [params.targetId] - ID of the target resource
 * @param {object} [params.metadata] - Extra context parameters
 * @param {string} [params.ipAddress] - Requester IP address
 * @param {string} [params.userAgent] - Requester agent string
 */
export async function writeAuditLog({
  actorUserId,
  actorRole,
  action,
  targetType = null,
  targetId = null,
  metadata = {},
  ipAddress = '127.0.0.1',
  userAgent = 'Unknown'
}) {
  try {
    const db = await getMongoDb();
    if (!db) {
      console.log(`[AUDIT Fallback] Actor: ${actorUserId} (${actorRole}) | Action: ${action} | Target: ${targetType}:${targetId}`);
      return;
    }

    const logEntry = {
      actorUserId,
      actorRole,
      action,
      targetType,
      targetId,
      metadata,
      ipAddress,
      userAgent,
      createdAt: new Date()
    };

    await db.collection('audit_logs').insertOne(logEntry);
    console.log(`[AUDIT LOGGED] Action: ${action} | Actor: ${actorUserId}`);
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
