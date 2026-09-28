/* COMEX form catalogue, reused from comex-frontend-v2 (src/config/comexForms.js).
 * Display data only: titles, descriptions, the step each form is needed at,
 * and which languages exist. There are no files — nothing downloads in the
 * prototype. Groups are ordered by when a Project Lead meets them. */

const LANGUAGE_LABELS = { en: 'English', fil: 'Filipino' }

function variantsFor(number, languages = ['en']) {
  return languages.map((lang) => LANGUAGE_LABELS[lang] ?? lang)
}

export const COMEX_FORM_GROUPS = [
  {
    id: "coordination",
    title: "Coordination and consent",
    description:
      "Completed early, while you are agreeing the engagement with the partner community.",
    forms: [
      {
        code: "COMEX Form 002",
        title: "Manifestation of Consent and Initial Agreement for the Extension Program",
        description:
          "The partner community's written agreement to an extension program. Use this one when the engagement is a continuing program rather than a one-off activity.",
        usedAtSteps: "Step 4",
        variants: variantsFor("002", ["en", "fil"]),
      },
      {
        code: "COMEX Form 003",
        title:
          "Manifestation of Consent and Initial Agreement for Seminar, Workshop or Training",
        description:
          "The partner community's written agreement to a seminar, workshop or training session.",
        usedAtSteps: "Step 4",
        variants: variantsFor("003", ["en", "fil"]),
      },
      {
        code: "COMEX Form 004",
        title: "Manifestation of Consent and Initial Agreement for the Outreach Project",
        description:
          "The partner community's written agreement to an outreach project.",
        usedAtSteps: "Step 4",
        variants: variantsFor("004", ["en", "fil"]),
      },
      {
        code: "MOA / MOU",
        title: "Memorandum of Agreement / Understanding",
        description:
          "Secured through the AILPO office when the engagement needs a formal agreement in place before it begins. Not a COMEX-numbered form — request it from AILPO.",
        usedAtSteps: "Step 3",
        variants: [],
      },
    ],
  },
  {
    id: "assessment",
    title: "Community needs assessment",
    description:
      "Completed when you interview the community and document what they actually need.",
    forms: [
      {
        code: "COMEX Form 016",
        title: "Consent Form for Community Interview, and Needs Assessment Questions",
        description:
          "Two pages: the consent each interviewee signs beforehand, followed by the question set used during the interview.",
        usedAtSteps: "Step 5",
        variants: variantsFor("016", ["en"]),
      },
      {
        code: "COMEX Form 017",
        title:
          "Pahayag ng Pagpayag at Pakikiisa Para sa Survey ng Komunidad (Community Survey Consent)",
        description:
          "Consent for the community needs-assessment survey. Only a Filipino version of this form exists.",
        usedAtSteps: "Step 5",
        variants: variantsFor("017", ["fil"]),
      },
      {
        code: "COMEX Form 005",
        title: "Needs Assessment Report",
        description:
          "Your written findings from the interviews and surveys, summarising what the community needs.",
        usedAtSteps: "Step 5",
        variants: variantsFor("005", ["en"]),
      },
    ],
  },
  {
    id: "proposal",
    title: "Proposal and criteria",
    description: "The main submission, plus the checklist that matches your type of project.",
    forms: [
      {
        code: "COMEX Form 001",
        title: "Community Engagement Proposal Form",
        description:
          "The core proposal document. Every Community Engagement needs this one, whatever its type.",
        usedAtSteps: "Step 7",
        variants: variantsFor("001", ["en"]),
      },
      {
        code: "COMEX Form 018",
        title: "Project Proposal Form",
        description:
          "The NSTP-side project proposal, used where the engagement runs under the National Service Training Program.",
        usedAtSteps: "Step 7",
        variants: variantsFor("018", ["en"]),
      },
      {
        code: "COMEX Form 006",
        title: "Checklist of Criteria for Program Proposal",
        description:
          "Confirms an extension program meets the office's criteria before review.",
        usedAtSteps: "Step 7",
        variants: variantsFor("006", ["en"]),
      },
      {
        code: "COMEX Form 007",
        title: "Checklist of Seminar, Workshop or Training Proposal",
        description:
          "Confirms a seminar, workshop or training meets the office's criteria before review.",
        usedAtSteps: "Step 7",
        variants: variantsFor("007", ["en"]),
      },
      {
        code: "COMEX Form 008",
        title: "Checklist of Criteria for Outreach Project Proposal",
        description:
          "Confirms an outreach project meets the office's criteria before review.",
        usedAtSteps: "Step 7",
        variants: variantsFor("008", ["en"]),
      },
    ],
  },
  {
    id: "endorsement",
    title: "Endorsement",
    description: "Required before the engagement can be approved and carried out.",
    forms: [
      {
        code: "SARF",
        title: "Student Activity Request Form",
        description:
          "Required only when the Project Lead is a Student. Issued by the SDAO Office, and needed before the Directors' endorsement.",
        usedAtSteps: "Step 8",
        variants: [],
      },
    ],
  },
  {
    id: "implementation",
    title: "During implementation",
    description: "Filled in while the engagement is actually running.",
    forms: [
      {
        code: "COMEX Form 010",
        title: "Attendance Sheet",
        description:
          "Records who attended each activity. Signed on the day, and needed later as evidence of participation.",
        usedAtSteps: "Step 12",
        variants: variantsFor("010", ["en"]),
      },
      {
        code: "COMEX Form 011",
        title: "Acknowledgement Receipt",
        description:
          "Signed by the recipient when goods, materials or funds are handed over to the community.",
        usedAtSteps: "Step 12",
        variants: variantsFor("011", ["en"]),
      },
      {
        code: "COMEX Form 009",
        title: "Progress Report",
        description:
          "Submitted for each completed phase of an engagement that runs in several stages.",
        usedAtSteps: "Step 13",
        variants: variantsFor("009", ["en"]),
      },
    ],
  },
  {
    id: "reporting",
    title: "Evaluation and closing reports",
    description: "Completed after the engagement, to close it out formally.",
    forms: [
      {
        code: "COMEX Form 012",
        title: "Evaluation Form",
        description:
          "The participants' own evaluation of the activity. Available in English and Filipino so community respondents can answer in either.",
        usedAtSteps: "Step 14",
        variants: variantsFor("012", ["en", "fil"]),
      },
      {
        code: "COMEX Form 022",
        title: "Peer Evaluation Form",
        description:
          "Used where team members assess each other's contribution to the engagement.",
        usedAtSteps: "Step 14",
        variants: variantsFor("022", ["en"]),
      },
      {
        code: "COMEX Form 015",
        title: "Personal Reflection Form",
        description:
          "Each volunteer's own written reflection on what they did and what they took from it.",
        usedAtSteps: "Step 14",
        variants: variantsFor("015", ["en"]),
      },
      {
        code: "COMEX Form 014",
        title: "Capacity-Building Services Report",
        description:
          "Reports the capacity-building component of an engagement, where one was delivered.",
        usedAtSteps: "Step 14",
        variants: variantsFor("014", ["en"]),
      },
      {
        code: "COMEX Form 013",
        title: "End of Community Engagement and Terminal Report",
        description:
          "The final report that closes the engagement. Submitted once everything else is complete.",
        usedAtSteps: "Step 15",
        variants: variantsFor("013", ["en"]),
      },
      {
        code: "COMEX Form 023",
        title: "Certificate of Completion",
        description:
          "Issued to participants once the engagement has been completed and closed.",
        usedAtSteps: "Step 15",
        variants: variantsFor("023", ["en"]),
      },
    ],
  },
  {
    id: "nstp",
    title: "NSTP community service",
    description:
      "Used when the engagement runs under the National Service Training Program rather than as a school extension activity.",
    forms: [
      {
        code: "COMEX Form 019",
        title:
          "Manifestation of Consent and Initial Agreement for the Community Service of NSTP Students",
        description:
          "The partner community's agreement to host NSTP students for community service.",
        usedAtSteps: "Step 4",
        variants: variantsFor("019", ["en", "fil"]),
      },
      {
        code: "COMEX Form 020",
        title: "NSTP Community Service Materials Request Form",
        description:
          "Requests the materials an NSTP community service activity needs, ahead of the activity.",
        usedAtSteps: "Step 12",
        variants: variantsFor("020", ["en"]),
      },
      {
        code: "COMEX Form 021",
        title: "Community Service Daily Time Record Form",
        description:
          "The daily time record NSTP students keep for their community service hours.",
        usedAtSteps: "Step 12",
        variants: variantsFor("021", ["en"]),
      },
      {
        code: "COMEX Form 024",
        title: "Class Observation Form",
        description:
          "Used to observe and document an NSTP class session as part of the program's monitoring.",
        usedAtSteps: "Step 12",
        variants: variantsFor("024", ["en"]),
      },
    ],
  },
];
