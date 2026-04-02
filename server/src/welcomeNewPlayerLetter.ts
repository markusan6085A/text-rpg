import type { FastifyBaseLogger } from "fastify";
import { prisma } from "./db";

/** Reserved; same token checked on POST /letters. */
export const WELCOME_NEW_PLAYER_SUBJECT = "[WELCOME_NEW_PLAYER]";

const SYSTEM_SENDER_NAME = "Existence";

const WELCOME_NEW_PLAYER_MESSAGE = `Вітаємо в нашому світі!

Ми раді, що ти приєднався. Зараз гра перебуває в активній розробці: зʼявляється новий контент, час від часу змінюється баланс і виправляються помилки. Можливі короткі технічні перерви або дрібні недоліки в інтерфейсі — дякуємо за терпіння та зворотний звʼязок.

З чого почати:
• Місто — твій головний пункт: телепорт на поля з монстрами, магазини, гільдія навичок, квести, пошта й спілкування з іншими гравцями.
• У цьому розділі «Помічник» зібрані підказки покроково: рух по світу, бій, досвід і SP, екіпірування, ринок, валюти, клани та інше — загляни сюди, коли захочеш зорієнтуватися.

Грай під своїм профілем і зі стабільним інтернетом — так зручніше не губити звʼязок з персонажем між візитами.

Бажаємо приємних боїв і цікавих пригод.

З повагою,
Existence`;

export async function trySendWelcomeLetterForNewAccount(opts: {
  newCharacterId: string;
  log: FastifyBaseLogger;
}): Promise<void> {
  const { newCharacterId, log } = opts;
  try {
    const sender = await prisma.character.findFirst({
      where: { name: { equals: SYSTEM_SENDER_NAME, mode: "insensitive" } },
      select: { id: true },
    });
    if (!sender) {
      log.warn({ sender: SYSTEM_SENDER_NAME }, "Welcome letter: system character not found");
      return;
    }
    if (sender.id === newCharacterId) return;

    await prisma.letter.create({
      data: {
        fromCharacterId: sender.id,
        toCharacterId: newCharacterId,
        subject: WELCOME_NEW_PLAYER_SUBJECT,
        message: WELCOME_NEW_PLAYER_MESSAGE,
      },
    });
    log.info({ toCharacterId: newCharacterId }, "Welcome letter sent for first character on account");
  } catch (e) {
    log.error(e, "Welcome letter: failed to create");
  }
}
