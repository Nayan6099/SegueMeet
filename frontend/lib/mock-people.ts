export interface Person {
  id: string;
  name: string;
  email: string;
  roles: string[];
  isBoardMember: boolean;
  status: "Active" | "Pending" | "Inactive";
  avatar?: string;
}

export const mockPeople: Person[] = [
  {
    id: "p1",
    name: "Kartikey Agrahari",
    email: "2k22.cse.2212451@gmail.com",
    roles: ["Administrator", "Board Member"],
    isBoardMember: true,
    status: "Active",
  },
  {
    id: "p2",
    name: "Nayan",
    email: "nayan@example.com",
    roles: ["Board Member"],
    isBoardMember: true,
    status: "Pending",
  },
  {
    id: "p3",
    name: "Ashutosh",
    email: "ashutosh@example.com",
    roles: ["Executive/Guest"],
    isBoardMember: false,
    status: "Active",
  },
  {
    id: "p4",
    name: "Aman",
    email: "aman@example.com",
    roles: ["Senior Executive"],
    isBoardMember: false,
    status: "Active",
  },
];
