import { z } from "zod";
import { getLocalUser, prisma } from "@/lib/db";

const band = z.number().min(0).max(9).multipleOf(0.5);
const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date in YYYY-MM-DD format.").refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Choose a valid calendar date.");

export const themeSchema = z.enum(["light", "dark", "system"]);
export type Theme = z.infer<typeof themeSchema>;

export const settingsPatchSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80),
  targetBand: band.min(1),
  examDate: calendarDate.nullable(),
  estimatedListening: band.nullable(),
  estimatedReading: band.nullable(),
  estimatedWriting: band.nullable(),
  estimatedSpeaking: band.nullable(),
  dailyStudyMinutes: z.number().int().min(5).max(720),
  vocabularySessionSize: z.number().int().min(1).max(100),
  timezone: z.string().min(1).max(100).refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value }).format();
      return true;
    } catch {
      return false;
    }
  }, "Choose a valid timezone, such as Asia/Dhaka."),
  theme: themeSchema,
}).partial().strict().refine((value) => Object.keys(value).length > 0, "Provide at least one setting to update.");

export type SettingsPatch = z.infer<typeof settingsPatchSchema>;

export type ProfileSettings = {
  userId: string;
  name: string;
  targetBand: number;
  examDate: string | null;
  estimatedListening: number | null;
  estimatedReading: number | null;
  estimatedWriting: number | null;
  estimatedSpeaking: number | null;
  dailyStudyMinutes: number;
  vocabularySessionSize: number;
  timezone: string;
  theme: Theme;
  createdAt: string;
  updatedAt: string;
};

export function serializeSettings(user: Awaited<ReturnType<typeof getLocalUser>>): ProfileSettings {
  const settings = user.settings;
  if (!settings) throw new Error("The local profile has no settings. Run the database seed command.");
  return {
    userId: user.id,
    name: user.name,
    targetBand: settings.targetBand,
    examDate: settings.examDate?.toISOString().slice(0, 10) ?? null,
    estimatedListening: settings.estimatedListening,
    estimatedReading: settings.estimatedReading,
    estimatedWriting: settings.estimatedWriting,
    estimatedSpeaking: settings.estimatedSpeaking,
    dailyStudyMinutes: settings.dailyStudyMinutes,
    vocabularySessionSize: settings.vocabularySessionSize,
    timezone: settings.timezone,
    theme: themeSchema.parse(settings.theme),
    createdAt: user.createdAt.toISOString(),
    updatedAt: new Date(Math.max(user.updatedAt.getTime(), settings.updatedAt.getTime())).toISOString(),
  };
}

export async function getSettings(): Promise<ProfileSettings> {
  return serializeSettings(await getLocalUser());
}

export async function updateSettings(input: unknown): Promise<ProfileSettings> {
  const parsed = settingsPatchSchema.parse(input);
  const user = await getLocalUser();
  const { name, examDate, ...settings } = parsed;
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      settings: {
        update: {
          ...settings,
          ...(examDate !== undefined ? { examDate: examDate === null ? null : new Date(`${examDate}T00:00:00.000Z`) } : {}),
        },
      },
    },
    include: { settings: true },
  });
  return serializeSettings(updated);
}
