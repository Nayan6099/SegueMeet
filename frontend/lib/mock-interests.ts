export interface Interest {
  id: string;
  memberName: string;
  description: string;
  nature: string;
  dateDeclared: string;
  status: "current" | "past";
}

export const mockInterests: Interest[] = [
  {
    id: "int1",
    memberName: "Kartikey Agrahari",
    description: "Director at Alpha Technologies",
    nature: "Financial",
    dateDeclared: "2025-01-15",
    status: "current",
  },
  {
    id: "int2",
    memberName: "Nayan",
    description: "Consultant for Beta Corp",
    nature: "Advisory",
    dateDeclared: "2024-11-02",
    status: "current",
  },
  {
    id: "int3",
    memberName: "Kartikey Agrahari",
    description: "Shareholder in Gamma Ltd",
    nature: "Financial",
    dateDeclared: "2023-05-20",
    status: "past",
  },
];
