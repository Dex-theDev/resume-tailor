import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { TailorResponse, ResumePool } from '../types'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 48,
    color: '#1a1a1a',
  },

  // Header
  name: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  contactLine: {
    fontSize: 9,
    textAlign: 'center',
    color: '#555',
    marginBottom: 16,
  },

  // Section
  sectionLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingBottom: 2,
    marginBottom: 6,
    marginTop: 12,
  },

  // Summary
  summaryText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#333',
  },

  // Skills
  skillRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  skillCategory: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    width: 100,
  },
  skillValues: {
    fontSize: 10,
    flex: 1,
    color: '#333',
  },

  // Experience
  companyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 1,
  },
  companyName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
  },
  dates: {
    fontSize: 9,
    color: '#555',
  },
  jobTitle: {
    fontSize: 9,
    color: '#666',
    marginBottom: 4,
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 4,
  },
  bulletDash: {
    width: 10,
    fontSize: 10,
    color: '#555',
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.45,
    color: '#333',
  },
  bulletLabel: {
    fontFamily: 'Helvetica-Bold',
  },
  companyBlock: {
    marginBottom: 10,
  },

  // Education
  educationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  educationName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  educationDate: {
    fontSize: 9,
    color: '#555',
  },
  educationDegree: {
    fontSize: 9,
    color: '#555',
  },
})

interface Props {
  result: TailorResponse
  pool: ResumePool
}

export default function ResumePDF({ result, pool }: Props) {
  const { contact, education } = pool

  // Group bullets by company, preserving order
  const byCompany = result.selectedBullets.reduce<Record<string, typeof result.selectedBullets>>(
    (acc, bullet) => {
      if (!acc[bullet.company]) acc[bullet.company] = []
      acc[bullet.company].push(bullet)
      return acc
    },
    {}
  )

  // Group skills by category
  const byCategory = result.selectedSkills.reduce<Record<string, string[]>>((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = []
    acc[skill.category].push(skill.name)
    return acc
  }, {})

  // Build contact line
  const contactParts = [contact.email, contact.linkedin, contact.github].filter(Boolean)

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>

        {/* Header */}
        <Text style={styles.name}>{contact.name}</Text>
        <Text style={styles.contactLine}>{contactParts.join('  |  ')}</Text>

        {/* Summary */}
        <Text style={styles.sectionLabel}>Summary</Text>
        <Text style={styles.summaryText}>{result.summary.text}</Text>

        {/* Skills */}
        <Text style={styles.sectionLabel}>Skills</Text>
        {Object.entries(byCategory).map(([category, skills]) => (
          <View key={category} style={styles.skillRow}>
            <Text style={styles.skillCategory}>{category}:</Text>
            <Text style={styles.skillValues}>{skills.join(', ')}</Text>
          </View>
        ))}

        {/* Experience */}
        <Text style={styles.sectionLabel}>Experience</Text>
        {Object.entries(byCompany).map(([company, bullets]) => (
          <View key={company} style={styles.companyBlock}>
            <View style={styles.companyRow}>
              <Text style={styles.companyName}>{company}</Text>
              <Text style={styles.dates}>{bullets[0].dates}</Text>
            </View>
            <Text style={styles.jobTitle}>{bullets[0].title}</Text>
            {bullets.map((b) => (
              <View key={b.id} style={styles.bullet}>
                <Text style={styles.bulletDash}>▸</Text>
                <Text style={styles.bulletText}>
                  <Text style={styles.bulletLabel}>{b.label}: </Text>
                  {b.text}
                </Text>
              </View>
            ))}
          </View>
        ))}

        {/* Education */}
        <Text style={styles.sectionLabel}>Education</Text>
        {education.map((ed) => (
          <View key={ed.institution}>
            <View style={styles.educationRow}>
              <Text style={styles.educationName}>{ed.institution}</Text>
              <Text style={styles.educationDate}>{ed.date}</Text>
            </View>
            <Text style={styles.educationDegree}>{ed.degree}</Text>
          </View>
        ))}

      </Page>
    </Document>
  )
}
