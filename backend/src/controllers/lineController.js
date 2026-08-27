import { asyncHandler } from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import { verifyLineSignature } from '../utils/lineSignature.js';
import { replyText } from '../services/lineService.js';
import { generateLinkCode, bindByLinkCode } from '../services/lineLinkService.js';
import { ApiError } from '../utils/ApiError.js';

// ── POST /drivers/:driverId/line/link-code（司機，需登入）──
export const createLinkCode = asyncHandler(async (req, res) => {
  const { code, expiresAt, ttlMinutes } = await generateLinkCode(req.params.driverId);
  res.json({
    code,
    expiresAt,
    ttlMinutes,
    addFriendUrl: config.line.addFriendUrl || null,
    instructions: '加入官方帳號好友後，把這組代碼傳給它即可完成綁定。',
  });
});

// ── POST /api/v1/line/webhook（LINE 平台呼叫）──
// 需在 app.js 以 express.json({ verify }) 保留 req.rawBody 供簽章驗證。
export const webhook = asyncHandler(async (req, res) => {
  const signature = req.get('x-line-signature');
  const raw = req.rawBody;

  if (!config.line.webhookEnabled) {
    logger.warn('LINE_CHANNEL_SECRET 未設定，webhook 略過');
    return res.status(200).end();
  }
  if (!verifyLineSignature(raw, signature)) {
    throw ApiError.unauthorized('LINE 簽章驗證失敗');
  }

  const events = Array.isArray(req.body?.events) ? req.body.events : [];

  // 立刻回 200，事件逐一處理（失敗不影響回應）
  res.status(200).end();

  for (const event of events) {
    try {
      await handleEvent(event);
    } catch (err) {
      logger.error('處理 LINE 事件失敗', err?.message || err);
    }
  }
});

async function handleEvent(event) {
  const userId = event?.source?.userId;

  if (event.type === 'follow') {
    await replyText(
      event.replyToken,
      '歡迎加入 RideHub！\n請到司機後台「LINE 通知」產生綁定碼，再把代碼傳給我即可開始收預約通知。',
    );
    return;
  }

  if (event.type === 'message' && event.message?.type === 'text') {
    const text = event.message.text;
    let driver = null;
    try {
      driver = await bindByLinkCode(text, userId);
    } catch (err) {
      if (err instanceof ApiError) {
        await replyText(event.replyToken, `⚠️ ${err.message}`);
        return;
      }
      throw err;
    }

    if (driver) {
      await replyText(event.replyToken, `✅ 綁定成功，${driver.name} 司機！之後有新預約會即時通知你。`);
    } else {
      await replyText(
        event.replyToken,
        '找不到對應的綁定碼。請確認代碼正確（6 碼、30 分鐘內有效），或到司機後台重新產生。',
      );
    }
  }
}
