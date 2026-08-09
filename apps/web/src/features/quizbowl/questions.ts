export interface QuizQuestion {
  id: string
  merchant: string
  text: string
  answer: string
}

// Placeholder content — real questions come from the admin-managed
// merchants/questions collections once that's built.
export const HARDCODED_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    merchant: 'Aling Nena\'s Turon',
    text: 'What year was this stall founded?',
    answer: '1998',
  },
  {
    id: 'q2',
    merchant: 'Guadalupe Church Souvenirs',
    text: "What is the shop owner's first name?",
    answer: 'maria',
  },
  {
    id: 'q3',
    merchant: 'Mango Float Corner',
    text: "What is this shop's signature product?",
    answer: 'mango float',
  },
  {
    id: 'q4',
    merchant: 'Jeepney Parts & More',
    text: 'What street is this shop located on?',
    answer: 'rizal street',
  },
  {
    id: 'q5',
    merchant: 'Barangay Craft Stand',
    text: 'What material is the shop sign made of?',
    answer: 'wood',
  },
]

export const WIN_THRESHOLD = 4
