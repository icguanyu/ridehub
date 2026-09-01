import { supabaseAdmin } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';
import { VERIFICATION_POINTS, TRUST_THRESHOLDS } from '../constants.js';
import { getDriverById } from './driverService.js';

// 取一個司機所有驗證項目的原始列。
async function rawVerifications(driverId) {
  const { data, error } = await supabaseAdmin
    .from('driver_verifications')
    .select('kind, status, note, reviewed_at')
    .eq('driver_id', driverId);
  if (error) throw error;
  return data ?? [];
}

function levelFor(score, hasPending) {
  if (score >= TRUST_THRESHOLDS.green) return 'green';
  if (hasPending || score >= TRUST_THRESHOLDS.yellow) return 'yellow';
  return 'red';
}

// 重算 trust_score / trust_level 並寫回 drivers。
// 任何會改變驗證狀態的動作（送審、審核、換大頭貼）之後都要呼叫。
export async function recomputeTrust(driverId) {
  const rows = await rawVerifications(driverId);
  let score = 0;
  let hasPending = false;
  for (const r of rows) {
    if (r.status === 'approved') score += VERIFICATION_POINTS[r.kind] ?? 0;
    if (r.status === 'pending') hasPending = true;
  }
  const level = levelFor(score, hasPending);

  const { error } = await supabaseAdmin
    .from('drivers')
    .update({ trust_score: score, trust_level: level })
    .eq('id', driverId);
  if (error) throw error;

  return { trustScore: score, trustLevel: level };
}

// 給司機端 / admin 用的整理過摘要。
export async function verificationSummary(driverId) {
  const driver = await getDriverById(driverId);
  const rows = await rawVerifications(driverId);
  return {
    trustScore: driver.trust_score ?? 0,
    trustLevel: driver.trust_level ?? 'red',
    items: rows.map((r) => ({
      kind: r.kind,
      status: r.status,
      note: r.note ?? null,
      reviewedAt: r.reviewed_at ?? null,
    })),
  };
}

// 司機送出「真人大頭照」審核。需已有 avatar。
export async function submitPhotoVerification(driverId) {
  const driver = await getDriverById(driverId);
  if (!driver.avatar_path) throw ApiError.badRequest('請先上傳大頭貼再送審');

  const { data: existing, error: exErr } = await supabaseAdmin
    .from('driver_verifications')
    .select('id, status')
    .eq('driver_id', driverId)
    .eq('kind', 'photo')
    .maybeSingle();
  if (exErr) throw exErr;

  if (existing?.status === 'pending') throw ApiError.conflict('大頭照已在審核中');
  if (existing?.status === 'approved') throw ApiError.conflict('大頭照已通過審核');

  const payload = {
    status: 'pending',
    note: null,
    reviewed_by: null,
    reviewed_at: null,
    file_path: driver.avatar_path,
  };

  if (existing) {
    const { error } = await supabaseAdmin
      .from('driver_verifications')
      .update(payload)
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabaseAdmin
      .from('driver_verifications')
      .insert({ driver_id: driverId, kind: 'photo', ...payload });
    if (error) throw error;
  }

  await recomputeTrust(driverId);
  return verificationSummary(driverId);
}

// 換 / 移除大頭貼時呼叫：已核准或待審的 photo 驗證要退回重審 / 移除。
export async function onAvatarChanged(driverId, { removed = false } = {}) {
  const { data: row, error } = await supabaseAdmin
    .from('driver_verifications')
    .select('id, status')
    .eq('driver_id', driverId)
    .eq('kind', 'photo')
    .maybeSingle();
  if (error) throw error;
  if (!row) return;

  if (removed) {
    await supabaseAdmin.from('driver_verifications').delete().eq('id', row.id);
  } else if (row.status !== 'rejected') {
    // approved / pending → 退回 pending 重審（照片已換，舊的核准不再有效）
    await supabaseAdmin
      .from('driver_verifications')
      .update({ status: 'pending', reviewed_by: null, reviewed_at: null })
      .eq('id', row.id);
  }

  await recomputeTrust(driverId);
}
