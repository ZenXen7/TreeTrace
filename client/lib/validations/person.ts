import { z } from "zod"

export const personFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  relationship: z.string(),
  gender: z.string().optional(),
  medicalConditions: z.array(z.string()).optional(),
  fatherId: z.string().optional(),
  motherId: z.string().optional(),
})

export type PersonFormValues = z.infer<typeof personFormSchema>
