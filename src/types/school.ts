export type Student = {
  id: number;
  number: string;
  first_name: string;
  last_name: string;
  email: string;
  active: boolean;
};

export type DbClass = {
  id: number;
  name: string;
  level: string;
  academic_year: string;
  students: Student[];
};
