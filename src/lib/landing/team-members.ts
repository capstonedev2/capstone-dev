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
    shortBio: 'Leads project planning and team coordination while leading system development, ensuring timely delivery and high-quality implementation aligned with project goals..'
  },
  {
    id: 'Assistant Developer',
    name: 'James Anthony Z. Juntilla',
    role: 'Assistant Developer',
    image: '/team/member%202.png',
    shortBio: 'Supports development tasks, assists in coding and testing, and helps ensure a smooth and efficient project workflow.'
  },
  {
    id: 'System Analyst & Research Lead',
    name: 'Princess Camille N. Achas',
    role: 'System Analyst & Research Lead',
    image: '/team/member%203.png',
    shortBio:
      'Analyzes system requirements, conducts interviews, and leads research and documentation to ensure the system meets user needs and project objectives.'
  },
  {
    id: 'Documentation Specialist',
    name: 'Ivy A. Bitos',
    role: 'Documentation Specialist',
    image: '/team/member%204.png',
    shortBio: 'Prepares, organizes, and maintains accurate project documentation and system records.'
  }
];
