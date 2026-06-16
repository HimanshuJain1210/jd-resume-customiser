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
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 54,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#222",
    lineHeight: 1.45,
  },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 5, color: "#1F4E5F" },
  contact: { fontSize: 9, color: "#555", marginBottom: 2 },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    marginTop: 18,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderBottom: "0.75pt solid #1F4E5F",
    paddingBottom: 3,
    color: "#1F4E5F",
  },
  summary: { marginBottom: 0 },
  job: { marginBottom: 12 },
  jobHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 2,
  },
  jobTitle: { fontFamily: "Helvetica-Bold", fontSize: 10.5 },
  jobMeta: { fontSize: 9, color: "#666" },
  jobLocation: { fontSize: 9, color: "#666", marginBottom: 3 },
  bullet: { flexDirection: "row", marginTop: 4, paddingRight: 4 },
  bulletDot: { width: 12, color: "#1F4E5F" },
  bulletText: { flex: 1 },
  skillsLine: { marginBottom: 0 },
  projDesc: { marginBottom: 1, marginTop: 1 },
  eduRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
  },
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
  const r = data?.tailored_resume ?? ({} as Partial<CustomizeResult["tailored_resume"]>);
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
            {r.experience.map((job, i) => (
              <View key={i} wrap={false} style={s.job}>
                <View style={s.jobHeaderRow}>
                  <Text style={s.jobTitle}>
                    {job.title}
                    {job.company ? ` — ${job.company}` : ""}
                  </Text>
                  <Text style={s.jobMeta}>{job.dates}</Text>
                </View>
                {job.location ? <Text style={s.jobLocation}>{job.location}</Text> : null}
                {(job.bullets ?? []).map((b, j) => (
                  <Bullet key={j}>{b}</Bullet>
                ))}
              </View>
            ))}
          </>
        ) : null}

        {Array.isArray(r.projects) && r.projects.length ? (
          <>
            <Text style={s.sectionTitle}>Projects</Text>
            {r.projects.map((p, i) => (
              <View key={i} wrap={false} style={s.job}>
                <Text style={s.jobTitle}>{p.name}</Text>
                {p.description ? <Text style={s.projDesc}>{p.description}</Text> : null}
                {(p.bullets ?? []).map((b, j) => (
                  <Bullet key={j}>{b}</Bullet>
                ))}
              </View>
            ))}
          </>
        ) : null}

        {Array.isArray(r.education) && r.education.length ? (
          <>
            <Text style={s.sectionTitle}>Education</Text>
            {r.education.map((e, i) => (
              <View key={i} style={s.eduRow}>
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
            {r.certifications.map((c, i) => (
              <Bullet key={i}>{c}</Bullet>
            ))}
          </>
        ) : null}
      </Page>
    </Document>
  );
}
