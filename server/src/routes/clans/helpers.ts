import { prisma } from "../../db";

export type ClanRole = "leader" | "deputy" | "member" | "none";

/** Повертає роль поточного гравця в клані */
export async function getClanRole(
  clanId: string,
  characterId: string
): Promise<ClanRole> {
  const clan = await prisma.clan.findUnique({
    where: { id: clanId },
    select: { creatorId: true },
  });
  if (!clan) return "none";

  if (clan.creatorId === characterId) return "leader";

  const member = await prisma.clanMember.findFirst({
    where: { clanId, characterId },
  });
  if (!member) return "none";

  return member.isDeputy ? "deputy" : "member";
}

/** Чи може керувати кланом (лідер або зам) */
export async function canManageClan(
  clanId: string,
  characterId: string
): Promise<boolean> {
  const role = await getClanRole(clanId, characterId);
  return role === "leader" || role === "deputy";
}
