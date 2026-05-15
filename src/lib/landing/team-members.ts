export type TeamMember = {
  id: string;
  name: string;
  role: string;
  image: string;
  shortBio: string;
};

export const teamMembers: TeamMember[] = [
  {
    id: 'Project Manager & Lead Developer',
    name: 'Kyle Japheth C. Graniten',
    role: 'Project Manager & Lead Developer',
    image: '/team/Team%20Leader%201.png',
    shortBio: 'Leads planning, coordination, and core system development.'
  },
  {
    id: 'Assistant Developer',
    name: 'James Anthony Z. Juntilla',
    role: 'Assistant Developer',
    image: '/team/member%202.png',
    shortBio: 'Supports coding, testing, and implementation tasks.'
  },
  {
    id: 'System Analyst & Research Lead',
    name: 'Princess Camille N. Achas',
    role: 'System Analyst & Research Lead',
    image: '/team/member%203.png',
    shortBio: 'Handles requirements, research, and system analysis.'
  },
  {
    id: 'Documentation Specialist',
    name: 'Ivy A. Bitos',
    role: 'Documentation Specialist',
    image: '/team/member%204.png',
    shortBio: 'Organizes project documents and system records.'
  }
];
