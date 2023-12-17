import { faker } from "@faker-js/faker";

// ----------------------------------------------------------------------

export const results = [...Array(24)].map((_, index) => ({
  id: faker.string.uuid(),
  avatarUrl: `/assets/images/avatars/avatar_${index + 1}.jpg`,
  name: faker.person.fullName(),
  company: faker.company.name(),
  enchere: "MDS avec 35 futs",
  fin: "Lundi 35 avril 8h34",
  isVerified: faker.datatype.boolean(),
  status: "active",
  role: "Leader",
}));
