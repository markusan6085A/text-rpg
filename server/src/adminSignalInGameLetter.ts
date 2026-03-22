import { prisma } from "./db";

/** Отримувач: нік персонажа в грі (твій адмін-аккаунт) або cuid */
export function isInGameSignalLetterConfigured(): boolean {
  return Boolean(
    process.env.ADMIN_SIGNAL_LETTER_TO_ID?.trim() || process.env.ADMIN_SIGNAL_LETTER_TO_NAME?.trim()
  );
}

type LogFn = (msg: string, meta?: object) => void;

/**
 * Системне повідомлення в ігрову пошту (таблиця Letter).
 * Відправник за замовчуванням — персонаж "Existence" (як у 7 Печатей), можна перевизначити env.
 */
export async function sendAdminSignalsInGameLetter(
  subject: string,
  message: string,
  log: LogFn
): Promise<boolean> {
  const toId = process.env.ADMIN_SIGNAL_LETTER_TO_ID?.trim();
  const toName = process.env.ADMIN_SIGNAL_LETTER_TO_NAME?.trim();
  const fromId = process.env.ADMIN_SIGNAL_LETTER_FROM_ID?.trim();
  const fromName = process.env.ADMIN_SIGNAL_LETTER_FROM_NAME?.trim() || "Existence";

  let toChar =
    toId != null && toId !== ""
      ? await prisma.character.findUnique({ where: { id: toId }, select: { id: true, name: true } })
      : null;
  if (!toChar && toName) {
    toChar = await prisma.character.findFirst({
      where: { name: { equals: toName, mode: "insensitive" } },
      orderBy: { lastActivityAt: "desc" },
      select: { id: true, name: true },
    });
  }
  if (!toChar) {
    log(
      `[AdminSignal] Ігрова пошта: отримувач не знайдений (ADMIN_SIGNAL_LETTER_TO_NAME або ADMIN_SIGNAL_LETTER_TO_ID)`
    );
    return false;
  }

  let fromChar =
    fromId != null && fromId !== ""
      ? await prisma.character.findUnique({ where: { id: fromId }, select: { id: true, name: true } })
      : null;
  if (!fromChar) {
    fromChar = await prisma.character.findFirst({
      where: { name: { equals: fromName, mode: "insensitive" } },
      select: { id: true, name: true },
    });
  }
  if (!fromChar) {
    log(`[AdminSignal] Ігрова пошта: відправник не знайдений (${fromName}, задайте ADMIN_SIGNAL_LETTER_FROM_NAME/ID)`);
    return false;
  }
  if (fromChar.id === toChar.id) {
    log(`[AdminSignal] Ігрова пошта: from і to один персонаж — оберіть іншого отримувача (ADMIN_SIGNAL_LETTER_TO_NAME)`);
    return false;
  }

  const maxMsg = 14_000;
  const msg =
    message.length > maxMsg ? `${message.slice(0, maxMsg)}\n\n…[текст обрізано]` : message;
  const subj = subject.length > 220 ? `${subject.slice(0, 217)}…` : subject;

  await prisma.letter.create({
    data: {
      fromCharacterId: fromChar.id,
      toCharacterId: toChar.id,
      subject: subj,
      message: msg,
    },
  });
  log(`[AdminSignal] Ігровий лист надіслано → ${toChar.name} (${toChar.id})`);
  return true;
}
