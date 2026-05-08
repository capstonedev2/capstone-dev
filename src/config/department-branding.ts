export type DepartmentBranding = {
  code: string;
  departmentName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  highlightColor: string;
  textColor: string;
};

export const DEPARTMENT_BRANDINGS = {
  NAME: {
    code: 'BS NAME',
    departmentName: 'Bachelor of Science in Naval Architecture and Marine Engineering',
    primaryColor: '#142548',
    secondaryColor: '#264B7A',
    accentColor: '#57ABC6',
    highlightColor: '#C9A247',
    textColor: '#FFFFFF'
  },
  IT: {
    code: 'BS IT',
    departmentName: 'Bachelor of Science in Information Technology',
    primaryColor: '#1F2020',
    secondaryColor: '#3D3D3C',
    accentColor: '#FFFFFF',
    highlightColor: '#B08A47',
    textColor: '#FFFFFF'
  },
  TCM: {
    code: 'BS TCM',
    departmentName: 'Bachelor of Science in Technology Communication Management',
    primaryColor: '#700F9D',
    secondaryColor: '#713F8D',
    accentColor: '#F6BE00',
    highlightColor: '#EACDD0',
    textColor: '#FFFFFF'
  },
  ESM: {
    code: 'BS ESM',
    departmentName: 'Bachelor of Science in Energy Systems and Management',
    primaryColor: '#2E541B',
    secondaryColor: '#366122',
    accentColor: '#79B92D',
    highlightColor: '#D0A03A',
    textColor: '#FFFFFF'
  },
  NET: {
    code: 'BS NET',
    departmentName: 'Bachelor of Science in Network Engineering Technology',
    primaryColor: '#801617',
    secondaryColor: '#8D1919',
    accentColor: '#EAC593',
    highlightColor: '#C79A3C',
    textColor: '#FFFFFF'
  },
  MET: {
    code: 'BS MET',
    departmentName: 'Bachelor of Science in Manufacturing Engineering Technology',
    primaryColor: '#801617',
    secondaryColor: '#8D1919',
    accentColor: '#EAC593',
    highlightColor: '#C79A3C',
    textColor: '#FFFFFF'
  }
} satisfies Record<string, DepartmentBranding>;

export function getDepartmentBranding(departmentCode: string): DepartmentBranding {
  const normalizedCode = departmentCode.trim().toUpperCase().replace(/^BS\s*/, '');

  return DEPARTMENT_BRANDINGS[normalizedCode as keyof typeof DEPARTMENT_BRANDINGS] ?? DEPARTMENT_BRANDINGS.IT;
}
