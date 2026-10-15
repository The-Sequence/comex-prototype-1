/* Form 024 — NSTP class observation form. Three pages.
 * Faculty details sit in the measured value cells. Each of the 44 criteria
 * (six groups, rows measured on every physical page) takes a 1-7 rating
 * written in its RATING cell. "Class Observation Rating" can be filled from
 * an explicit average of the criteria the user has rated, or typed. Comments use the
 * printed box; observer/coordinator/faculty signatures sit on their lines. */
import { blank, onLine } from "./helpers.js";

// [physical page, printed group, id, printed criterion, row top, row bottom]
const CRITERIA = [
    [0, "LEARNING PROCESS", "learning-process-1", "The learners are engaged to think deeply with and about the important concepts and theories.", 0.6334, 0.6666],
    [0, "LEARNING PROCESS", "learning-process-2", "The learners have opportunities to create and generate new ideas.", 0.6666, 0.688],
    [0, "LEARNING PROCESS", "learning-process-3", "The learners are engaged in pair and group activities.", 0.688, 0.7095],
    [0, "LEARNING PROCESS", "learning-process-4", "The learners use their problem-solving, critical thinking, and other higher order thinking skills in real-life contexts.", 0.7095, 0.748],
    [0, "LEARNING PROCESS", "learning-process-5", "The learners are provided opportunities to communicate accurately, appropriately, and meaningfully.", 0.748, 0.7894],
    [0, "LEARNING PROCESS", "learning-process-6", "The learners are provided opportunities to reflect on their learning.", 0.7894, 0.8118],
    [0, "INSTRUCTIONAL DELIVERY", "instructional-delivery-1", "The teacher clarifies the learning outcomes.", 0.8342, 0.8557],
    [0, "INSTRUCTIONAL DELIVERY", "instructional-delivery-2", "The teacher aligns the learning outcomes with the institutional and program learning outcomes.", 0.8557, 0.8933],
    [1, "INSTRUCTIONAL DELIVERY", "instructional-delivery-3", "The teacher connects the lesson to real-life contexts.", 0.0909, 0.1124],
    [1, "INSTRUCTIONAL DELIVERY", "instructional-delivery-4", "The teacher adjusts his or her teaching style and approaches to different learners.", 0.1124, 0.15],
    [1, "INSTRUCTIONAL DELIVERY", "instructional-delivery-5", "The leader adjusts his or her teaching style and approaches to different flexible learning modalities.", 0.15, 0.1876],
    [1, "INSTRUCTIONAL DELIVERY", "instructional-delivery-6", "The teacher asks questions that require critical thinking.", 0.1876, 0.209],
    [1, "INSTRUCTIONAL DELIVERY", "instructional-delivery-7", "The teacher uses a variety of learning resources and materials appropriate for flexible learning.", 0.209, 0.2466],
    [1, "INSTRUCTIONAL DELIVERY", "instructional-delivery-8", "The teacher integrates appropriate technology that enhances the teaching-learning process.", 0.2466, 0.2842],
    [1, "INSTRUCTIONAL DELIVERY", "instructional-delivery-9", "The teacher employs activities and delivers instructions using technology with appropriate level of complexity.", 0.2842, 0.3218],
    [1, "INSTRUCTIONAL DELIVERY", "instructional-delivery-10", "The teacher adapts the syllabus to flexible learning environment.", 0.3218, 0.3432],
    [1, "INSTRUCTIONAL DELIVERY", "instructional-delivery-11", "The teacher breaks the complex topics into small digestible sessions.", 0.3432, 0.3647],
    [1, "INSTRUCTIONAL DELIVERY", "instructional-delivery-12", "The teacher makes the learning materials available offline and online.", 0.3647, 0.3862],
    [1, "ASSESSMENT", "assessment-1", "The learning outcomes have corresponding integrative (i.e., activities that target multiple learning outcomes) and independent learning activities and assessment.", 0.4076, 0.4632],
    [1, "ASSESSMENT", "assessment-2", "The assessment tasks simulate real-life contexts relevant to the learning outcomes.", 0.4632, 0.5008],
    [1, "ASSESSMENT", "assessment-3", "The teacher assesses learners’ misconceptions and current skills and knowledge (diagnostic assessment, comprehension checks) necessary for instructional planning and delivery.", 0.5008, 0.5554],
    [1, "ASSESSMENT", "assessment-4", "The teacher focuses on performance tasks, projects and other alternative forms of assessments (e.g., portfolios, projects, reflection papers and oral interviews) using appropriate rubrics.", 0.5554, 0.6119],
    [1, "ASSESSMENT", "assessment-5", "Learners are assessed in flexible multiple ways (self, peer, and teacher; summative and formative; traditional and alternative) to fully capture their performance at different levels.", 0.6119, 0.6675],
    [1, "ASSESSMENT", "assessment-6", "The teacher provides reinforcement or enrichment activities as appropriate or as needed.", 0.6675, 0.7051],
    [1, "ASSESSMENT", "assessment-7", "The teacher provides timely and quality feedback necessary for achieving the learning outcomes.", 0.7051, 0.7426],
    [1, "ASSESSMENT", "assessment-8", "The teacher maximizes appropriate technology in assessing my progress.", 0.7426, 0.7761],
    [1, "LEARNING ENVIRONMENT", "learning-environment-1", "The flexible learning environment is cooperative and supportive.", 0.7985, 0.8219],
    [1, "LEARNING ENVIRONMENT", "learning-environment-2", "The flexible learning environment promotes open communication between learners and teacher.", 0.8219, 0.8595],
    [1, "LEARNING ENVIRONMENT", "learning-environment-3", "The flexible learning environment has enough technology to achieve learning outcomes.", 0.8595, 0.8971],
    [2, "LEARNING ENVIRONMENT", "learning-environment-4", "The flexible learning environment promotes learners’ interest and enthusiasm in learning.", 0.0909, 0.1285],
    [2, "LEARNING ENVIRONMENT", "learning-environment-5", "The flexible learning environment helps learners become relaxed and comfortable.", 0.1285, 0.1661],
    [2, "LEARNING ENVIRONMENT", "learning-environment-6", "The flexible learning environment eliminates learning distractions.", 0.1661, 0.1885],
    [2, "CLASSROOM MANAGEMENT", "classroom-management-1", "The teacher observes class routines and procedures (e.g., class schedule, checking of attendance, explanation of syllabus).", 0.2109, 0.2504],
    [2, "CLASSROOM MANAGEMENT", "classroom-management-2", "The teacher follows the required conduct of synchronous sessions.", 0.2504, 0.2719],
    [2, "CLASSROOM MANAGEMENT", "classroom-management-3", "The teacher promotes proper behavior among learners.", 0.2719, 0.2933],
    [2, "CLASSROOM MANAGEMENT", "classroom-management-4", "The teacher recognizes each student during class participation or activities.", 0.2933, 0.3268],
    [2, "CLASSROOM MANAGEMENT", "classroom-management-5", "The teacher maintains learners’ attention and engagement.", 0.3268, 0.3483],
    [2, "CLASSROOM MANAGEMENT", "classroom-management-6", "The teacher provides clear instructions for all learning activities.", 0.3483, 0.3698],
    [2, "CLASSROOM MANAGEMENT", "classroom-management-7", "The activities are done with very few interruptions.", 0.3698, 0.3922],
    [2, "TEACHER QUALITIES", "teacher-qualities-1", "The teacher is knowledgeable in the subject matter.", 0.4146, 0.436],
    [2, "TEACHER QUALITIES", "teacher-qualities-2", "The teacher has good communication skills.", 0.436, 0.4575],
    [2, "TEACHER QUALITIES", "teacher-qualities-3", "The teacher is presentable and well groomed.", 0.4575, 0.479],
    [2, "TEACHER QUALITIES", "teacher-qualities-4", "The teacher exudes positive attitude.", 0.479, 0.5005],
    [2, "TEACHER QUALITIES", "teacher-qualities-5", "The teacher has technical skills in using technology.", 0.5005, 0.5229],
];

const detail = (id, label, top, extra = {}) => blank(id, label, { x: 0.434, y: top + 0.0005, w: 0.374, h: 0.0172, section: "Faculty", required: true, fontSize: 10, ...extra });

const fields = [
    detail("faculty-name", "Name of NSTP faculty", 0.2523),
    detail("status", "Status", 0.27),
    detail("observation-date", "Date of observation", 0.2873, { type: "date" }),
    detail("class-observed", "Class observed", 0.305),
    detail("term-year", "Term and academic year", 0.3227),
    ...CRITERIA.map(([page, group, id, criterion, top, bottom]) => ({
        ...blank(id, criterion, { page, type: "number", x: 0.71, y: top + Math.max(0, (bottom - top - 0.0175) / 2), w: 0.079, h: Math.min(0.0175, bottom - top), section: group, required: true, fontSize: 11 }),
        constraints: { min: 1, max: 7 },
    })),
    { ...blank("observation-rating", "Class observation rating", { page: 2, type: "number", x: 0.71, y: 0.5254, w: 0.079, h: 0.0175, section: "Result", fontSize: 11 }), total: { kind: "average", fields: CRITERIA.map(([, , id]) => id), decimals: 2 } },
    { ...blank("comments", "Comments and suggestions", { page: 2, type: "paragraph", x: 0.122, y: 0.605, w: 0.755, h: 0.158, section: "Comments" }), render: { overflow: "continuation" } },
    onLine("observer-signature", "Observed by: name of observer (signature)", { page: 2, type: "signature", x: 0.118, w: 0.206, textTop: 0.823, textHeight: 0.014, section: "Signatures", required: true }),
    onLine("coordinator-signature", "Verified and approved by: NSTP Coordinator (signature)", { page: 2, type: "signature", x: 0.361, w: 0.206, textTop: 0.823, textHeight: 0.014, section: "Signatures" }),
    onLine("faculty-signature", "Acknowledged by: faculty observed (signature)", { page: 2, type: "signature", x: 0.633, w: 0.215, textTop: 0.823, textHeight: 0.014, section: "Signatures" }),
].map((field, order) => ({ ...field, order }));

export default { "comex-form-024-en.pdf": { pageCount: 3, fields, aliases: { f1: "observer-signature", f2: "coordinator-signature", f3: "faculty-signature" } } };
