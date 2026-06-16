"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { CustomizeResult } from "@/lib/types";

// ATS-safe: single column, standard fonts, real text (selectable/parseable),
// no tables, no graphics, no columns that confuse parsers.

const s = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 36, paddingHorizontal: 44, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a", lineHeight: 1.4 },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 2, color: "#1F4E5F" },
  contact: { fontSize: 9, color: "#444", marginBottom: 10 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 12, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1pt solid #1F4E5F", paddingBottom: 2, color: "#1F4E5F" },
  summary: { marginBottom: 2 },
  jobHeaderRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  jobTitle: { fontFamily: "Helvetica-Bold" },
  jobMeta: { fontSize: 9, color: "#444" },
  bullet: { flexDirection: "row", marginTop: 2, paddingLeft: 4 },
  bulletDot: { width: 8 },
  bulletText: { flex: 1 },
  skillsLine: { marginTop: 2 },
});

function Bullet({ children }: { children: string }) {
  return (
    <View style={s.bullet}>
      <Text style={s.bulletDot}>•</Text>
      <Text style={s.bulletText}>{children}</Text>
    </View>
  );
}

export default function ResumePDF({ data }: { data: CustomizeResult }) {
  const r = data?.tailored_resume ?? {};
  const contact = r.contact ?? {};
  const contactLine = [
    contact.email,
    contact.phone,
    contact.location,
    ...(contact.links ?? []),
  ]
    .filter(Boolean)
    .join("  •  ");

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{r.name || "Your Name"}</Text>
        {contactLine ? <Text style={s.contact}>{contactLine}</Text> : null}

        {r.summary ? (
          <>
            <Text style={s.sectionTitle}>Summary</Text>
            <Text style={s.summary}>{r.summary}</Text>
          </>
        ) : null}

        {Array.isArray(r.skills) && r.skills.length ? (
          <>
            <Text style={s.sectionTitle}>Skills</Text>
            <Text style={s.skillsLine}>{r.skills.join(" • ")}</Text>
          </>
        ) : null}

        {Array.isArray(r.experience) && r.experience.length ? (
          <>
            <Text style={s.sectionTitle}>Experience</Text>
            {r.experience.map((job: any, i: number) => (
              <View key={i} wrap={false}>
                <View style={s.jobHeaderRow}>
                  <Text style={s.jobTitle}>
                    {job.title}
                    {job.company ? ` — ${job.company}` : ""}
                  </Text>
                  <Text style={s.jobMeta}>{job.dates}</Text>
                </View>
                {job.location ? <Text style={s.jobMeta}>{job.location}</Text> : null}
                {(job.bullets ?? []).map((b: string, j: number) => (
                  <Bullet key={j}>{b}</Bullet>
                ))}
              </View>
            ))}
          </>
        ) : null}

        {Array.isArray(r.projects) && r.projects.length ? (
          <>
            <Text style={s.sectionTitle}>Projects</Text>
            {r.projects.map((p: any, i: number) => (
              <View key={i} wrap={false}>
                <Text style={s.jobTitle}>{p.name}</Text>
                {p.description ? <Text>{p.description}</Text> : null}
                {(p.bullets ?? []).map((b: string, j: number) => (
                  <Bullet key={j}>{b}</Bullet>
                ))}
              </View>
            ))}
          </>
        ) : null}

        {Array.isArray(r.education) && r.education.length ? (
          <>
            <Text style={s.sectionTitle}>Education</Text>
            {r.education.map((e: any, i: number) => (
              <View key={i} style={s.jobHeaderRow}>
                <Text>
                  <Text style={s.jobTitle}>{e.degree}</Text>
                  {e.institution ? ` — ${e.institution}` : ""}
                  {e.details ? `  (${e.details})` : ""}
                </Text>
                <Text style={s.jobMeta}>{e.dates}</Text>
              </View>
            ))}
          </>
        ) : null}

        {Array.isArray(r.certifications) && r.certifications.length ? (
          <>
            <Text style={s.sectionTitle}>Certifications</Text>
            {r.certifications.map((c: string, i: number) => (
              <Bullet key={i}>{c}</Bullet>
            ))}
          </>
        ) : null}
      </Page>
    </Document>
  );
}
