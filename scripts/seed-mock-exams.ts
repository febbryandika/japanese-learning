import { config } from 'dotenv'

// Load .env.local first (takes precedence), then fall back to .env — mirrors
// drizzle.config.ts. Must run before the db client is imported (done dynamically
// in main), because the db module reads DATABASE_URL at import time.
config({ path: '.env.local' })
config({ path: '.env' })

// Dev-only seed for mock exams. SPEC §14 ships no exam data and admin exam
// management is out of scope for Phase 3a, so this hand-authors a couple of
// published exams to make the "Exam submits + scored" flow exercisable end to
// end. `correctAnswer` must match one of `choices` exactly — scoring compares
// the raw strings server-side.
//
// Destructive + idempotent: clears all exam tables (answers → attempts →
// questions → exams, FK order) so re-runs are clean.

type SeedQuestion = {
  sectionName: string
  prompt: string
  choices: string[]
  correctAnswer: string
  explanation?: string
}

type SeedExam = {
  title: string
  description: string
  timeLimitMinutes: number
  questions: SeedQuestion[]
}

const EXAMS: SeedExam[] = [
  {
    title: 'JLPT N2 Mock Exam 1',
    description:
      'A full-length practice exam covering grammar, vocabulary, reading, and listening at N2 level.',
    timeLimitMinutes: 90,
    questions: [
      // ── 文法 ──
      {
        sectionName: '文法',
        prompt: '彼は忙しい（　　）、私の手伝いをしてくれた。',
        choices: ['にもかかわらず', 'ものなら', 'どころか', 'ばかりに'],
        correctAnswer: 'にもかかわらず',
        explanation:
          '「〜にもかかわらず」は「〜のに」と同じく逆接を表し、N2の定番文型。',
      },
      {
        sectionName: '文法',
        prompt: 'この問題は難しくて、私（　　）解けない。',
        choices: ['には', 'にて', 'をば', 'やら'],
        correctAnswer: 'には',
        explanation: '「私には解けない」で能力・立場を表す「には」。',
      },
      {
        sectionName: '文法',
        prompt: '雨が降った（　　）、試合は中止になった。',
        choices: ['ために', 'くせに', 'わりに', 'ついでに'],
        correctAnswer: 'ために',
        explanation: '原因・理由を表す「〜ために」。',
      },
      {
        sectionName: '文法',
        prompt: '彼女は学生（　　）、なかなかしっかりしている。',
        choices: ['にしては', 'として', 'につれて', 'において'],
        correctAnswer: 'にしては',
        explanation: '「〜にしては」は予想と異なる評価を表す。',
      },
      // ── 語彙 ──
      {
        sectionName: '語彙',
        prompt: '「影響」の読み方として正しいものはどれか。',
        choices: ['えいきょう', 'えいぎょう', 'けいこう', 'けいきょう'],
        correctAnswer: 'えいきょう',
      },
      {
        sectionName: '語彙',
        prompt: '次の文に最も合う言葉を選びなさい。「予定を（　　）する。」',
        choices: ['変更', '変化', '交換', '転換'],
        correctAnswer: '変更',
        explanation: '予定を変えるは「変更」。',
      },
      {
        sectionName: '語彙',
        prompt: '「あいまい」の意味として最も近いものはどれか。',
        choices: ['はっきりしない', 'とても明るい', '非常に厳しい', '正確な'],
        correctAnswer: 'はっきりしない',
      },
      {
        sectionName: '語彙',
        prompt: '「節約」の対義語に最も近いものはどれか。',
        choices: ['浪費', '貯金', '我慢', '倹約'],
        correctAnswer: '浪費',
      },
      // ── 読解 ──
      {
        sectionName: '読解',
        prompt:
          '「最近、在宅勤務を導入する企業が増えている。通勤時間が減る一方で、仕事と生活の境界があいまいになるという課題もある。」この文章の主題は何か。',
        choices: [
          '在宅勤務の利点と課題',
          '通勤電車の混雑',
          '企業の業績悪化',
          '生活費の節約方法',
        ],
        correctAnswer: '在宅勤務の利点と課題',
      },
      {
        sectionName: '読解',
        prompt:
          '上の文章で「境界があいまいになる」とあるが、何の境界か。',
        choices: [
          '仕事と生活',
          '会社と家庭の場所',
          '上司と部下',
          '昼と夜',
        ],
        correctAnswer: '仕事と生活',
      },
      {
        sectionName: '読解',
        prompt:
          '「この商品は値段が高いが、その分品質も良い。」筆者の考えに最も近いものはどれか。',
        choices: [
          '高くても価値がある',
          '安い方が良い',
          '品質は関係ない',
          '買うべきではない',
        ],
        correctAnswer: '高くても価値がある',
      },
      {
        sectionName: '読解',
        prompt:
          '次の案内文「会議は午後2時から会議室Aで行います。資料は当日配布します。」から分かることはどれか。',
        choices: [
          '資料は事前に配られない',
          '会議は中止になった',
          '会議室は未定である',
          '会議は午前に行われる',
        ],
        correctAnswer: '資料は事前に配られない',
      },
      // ── 聴解（台本ベース）──
      {
        sectionName: '聴解',
        prompt:
          '【会話】男:「明日の打ち合わせ、10時からだったよね。」女:「ううん、30分早くなったよ。」打ち合わせは何時からか。',
        choices: ['9時30分', '10時', '10時30分', '9時'],
        correctAnswer: '9時30分',
      },
      {
        sectionName: '聴解',
        prompt:
          '【アナウンス】「次の電車は事故のため、約15分遅れて到着します。」電車について正しいものはどれか。',
        choices: [
          '遅れて来る',
          '来ない',
          '時間通りに来る',
          '15分早く来る',
        ],
        correctAnswer: '遅れて来る',
      },
      {
        sectionName: '聴解',
        prompt:
          '【会話】店員:「お会計は税込みで3,300円です。」客が5,000円を出した。おつりはいくらか。',
        choices: ['1,700円', '2,300円', '1,300円', '2,700円'],
        correctAnswer: '1,700円',
      },
      {
        sectionName: '聴解',
        prompt:
          '【会話】女:「週末、映画を見に行かない？」男:「ごめん、仕事があるんだ。来週なら大丈夫。」男はいつなら行けるか。',
        choices: ['来週', '今週末', '行けない', '明日'],
        correctAnswer: '来週',
      },
    ],
  },
  {
    title: 'Practice Mini-Exam',
    description:
      'A short 4-question warm-up with a tight time limit — handy for trying the timer and auto-submit.',
    timeLimitMinutes: 2,
    questions: [
      {
        sectionName: '文法',
        prompt: '宿題をする（　　）、ゲームをしてしまった。',
        choices: ['どころか', 'べきなのに', 'まいか', 'ところで'],
        correctAnswer: 'べきなのに',
      },
      {
        sectionName: '語彙',
        prompt: '「便利」の対義語はどれか。',
        choices: ['不便', '不安', '不満', '不利'],
        correctAnswer: '不便',
      },
      {
        sectionName: '読解',
        prompt:
          '「このボタンを押すと、機械が止まります。」ボタンを押すとどうなるか。',
        choices: ['機械が止まる', '機械が動く', '音が鳴る', '何も起きない'],
        correctAnswer: '機械が止まる',
      },
      {
        sectionName: '聴解',
        prompt:
          '【会話】男:「飲み物は何にする？」女:「私はコーヒーで。」女は何を頼むか。',
        choices: ['コーヒー', '紅茶', '水', 'ジュース'],
        correctAnswer: 'コーヒー',
      },
    ],
  },
]

async function main() {
  const { db } = await import('../src/lib/db')
  const {
    mockExams,
    mockExamQuestions,
    mockExamAttempts,
    mockExamAttemptAnswers,
  } = await import('../src/lib/db/schema')

  // Clear in FK order so re-runs are clean.
  await db.delete(mockExamAttemptAnswers)
  await db.delete(mockExamAttempts)
  await db.delete(mockExamQuestions)
  await db.delete(mockExams)

  let totalQuestions = 0

  for (const exam of EXAMS) {
    const [insertedExam] = await db
      .insert(mockExams)
      .values({
        title: exam.title,
        description: exam.description,
        timeLimitMinutes: exam.timeLimitMinutes,
        isPublished: true,
      })
      .returning({ id: mockExams.id })

    await db.insert(mockExamQuestions).values(
      exam.questions.map((q, index) => ({
        examId: insertedExam.id,
        sectionName: q.sectionName,
        prompt: q.prompt,
        choices: JSON.stringify(q.choices),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation ?? null,
        sortOrder: index,
      })),
    )

    totalQuestions += exam.questions.length
  }

  console.log(
    `Seeded ${EXAMS.length} mock exams / ${totalQuestions} questions.`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
