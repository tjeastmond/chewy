import { z } from 'zod'

const ContactSchema = z
  .object({
    email: z.string().email(),
    phone: z.string().min(1),
    location: z.string().min(1),
    linkedin: z.string().url(),
    github: z.string().url(),
  })
  .strict()

const ExperienceItemSchema = z
  .object({
    company: z.string().min(1),
    role: z.string().min(1),
    start: z.string().min(1),
    end: z.string().nullable(),
    dates_display: z.string().min(1),
    location: z.string().min(1),
    highlights: z.array(z.string()).default([]),
  })
  .strict()

const SkillsSchema = z.record(z.string(), z.array(z.string()))

const RoleTargetsSchema = z.record(
  z.string(),
  z
    .object({
      keywords: z.array(z.string()).default([]),
      emphasis: z
        .object({
          summary: z.string().min(1),
          skills_order: z.array(z.string()).default([]),
        })
        .strict(),
    })
    .strict()
)

export const ResumeSchema = z
  .object({
    name: z.string().min(1),
    title: z.string().min(1),
    contact: ContactSchema,
    summaries: z.record(z.string(), z.string()),
    experience: z.array(ExperienceItemSchema),
    skills: SkillsSchema,
    role_targets: RoleTargetsSchema.optional(),
    projects: z.array(z.unknown()).default([]),
  })
  .strict()

export type Resume = z.infer<typeof ResumeSchema>
