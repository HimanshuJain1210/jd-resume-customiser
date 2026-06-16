// Types mirroring the JSON the prompts are instructed to return.

export type SignalMap = {
  role_title: string;
  seniority: string;
  hard_skills: string[];
  soft_skills: string[];
  must_have_keywords: string[];
  nice_to_have: string[];
  domain_context: string[];
  implicit_signals: string[];
  disqualifiers: string[];
  tone: string;
};

export type ResumeContact = {
  email?: string;
  phone?: string;
  location?: string;
  links?: string[];
};

export type ResumeExperience = {
  title: string;
  company: string;
  location?: string;
  dates: string;
  bullets: string[];
};

export type ResumeEducation = {
  degree: string;
  institution: string;
  dates: string;
  details?: string;
};

export type ResumeProject = {
  name: string;
  description?: string;
  bullets: string[];
};

export type TailoredResume = {
  name: string;
  contact: ResumeContact;
  summary: string;
  skills: string[];
  experience: ResumeExperience[];
  education: ResumeEducation[];
  projects: ResumeProject[];
  certifications: string[];
};

export type MatchScore = {
  overall: number;
  keyword_coverage: number;
  skills_alignment: number;
  seniority_fit: number;
  rationale: string;
};

export type KeywordMapEntry = {
  keyword: string;
  status: "matched" | "partial" | "missing";
  evidence: string;
};

export type CustomizeResult = {
  tailored_resume: TailoredResume;
  match_score: MatchScore;
  keyword_map: KeywordMapEntry[];
  gaps: string[];
  changes_made: string[];
};
