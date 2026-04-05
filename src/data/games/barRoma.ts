/**
 * Bar Roma — Italian espresso bar.
 * Setting: A marble-counter Italian bar, morning rush.
 * Guide: Marco the barista.
 * Culture: Italians stand at the bar for espresso, no laptops, no lingering.
 */
import type { PhraseGameConfig } from '../../pages/games/PhraseGame'

export const barRomaConfig: PhraseGameConfig = {
  name: 'Bar Roma',
  langCode: 'it',
  bcp47: 'it-IT',
  guide: {
    name: 'Marco',
    role: 'Il Barista',
    emoji: '☕',
    praise: 'Perfetto!',
  },
  theme: {
    bg:      'linear-gradient(180deg,#0e0a07 0%,#1a1009 60%,#2a1608 100%)',
    glow1:   '#c9893a18',
    glow2:   '#c9893a12',
    primary: '#e8b86d',
    muted:   '#7a5c3e',
    card:    'linear-gradient(160deg,#241508cc,#1a0f07cc)',
    border:  '#3d2b1a',
    bar:     'linear-gradient(90deg,#c9893a,#e8b86d)',
  },
  phrases: [
    { scene: 'Entering',        phrase: 'Buongiorno!',                      translation: 'Good morning!',                          tip: "Roll the 'r' in buonGIORno — warm and sunny." },
    { scene: 'Greeting',        phrase: 'Buongiorno, come sta?',             translation: 'Good morning, how are you?',             tip: '"Come sta" is formal — right for a stranger.' },
    { scene: 'Finding a spot',  phrase: "C'è posto al bancone?",             translation: 'Is there room at the bar?',              tip: 'Italians stand at the bar — it\'s faster and cheaper.' },
    { scene: 'Getting service', phrase: 'Mi scusi!',                         translation: 'Excuse me!',                             tip: 'Classic way to catch the barista\'s eye.' },
    { scene: 'Ordering',        phrase: 'Un caffè, per favore.',             translation: 'An espresso, please.',                   tip: "In Italy, 'caffè' always means espresso — short and strong." },
    { scene: 'Ordering',        phrase: 'Vorrei un cappuccino.',             translation: 'I would like a cappuccino.',             tip: 'Vor-REI — polite. No cappuccino after 11am in Italy!' },
    { scene: 'Ordering',        phrase: 'Un macchiato, per piacere.',        translation: 'A macchiato, please.',                   tip: "'Per piacere' and 'per favore' are both fine here." },
    { scene: 'Pastry counter',  phrase: 'Avete dei cornetti freschi?',       translation: 'Do you have fresh croissants?',          tip: 'A cornetto is sweeter and more buttery than a French croissant.' },
    { scene: 'Pastry counter',  phrase: 'Vorrei un cornetto alla crema.',    translation: 'A cream-filled croissant, please.',      tip: 'KREM-ah — the classic Italian pastry filling.' },
    { scene: 'Customizing',     phrase: 'Con latte caldo, per favore.',      translation: 'With warm milk, please.',                tip: 'LAT-teh — standard way to soften your espresso.' },
    { scene: 'Customizing',     phrase: 'Senza zucchero, grazie.',           translation: 'Without sugar, thank you.',              tip: "DZOOK-keh-ro = sugar. 'Senza' = without." },
    { scene: 'Waiting',         phrase: 'Quanto tempo ci vuole?',            translation: 'How long will it take?',                 tip: "Literal: 'how much time does it need?'" },
    { scene: 'Reading the menu',phrase: "Cos'è questo?",                     translation: 'What is this?',                         tip: 'Point and ask — baristas love explaining their specialties.' },
    { scene: 'Asking price',    phrase: 'Quanto costa?',                     translation: 'How much is it?',                       tip: 'KWAHN-to KOS-tah — the most useful Italian phrase.' },
    { scene: 'Asking price',    phrase: 'Quanto viene in totale?',           translation: 'How much is it in total?',              tip: "'Viene' means 'comes to' — as in the running total." },
    { scene: 'Paying',          phrase: 'Il conto, per favore.',             translation: 'The bill, please.',                     tip: "You must ask — Italian staff won't bring it unannounced." },
    { scene: 'Paying',          phrase: 'Posso pagare con carta?',           translation: 'Can I pay by card?',                    tip: 'Some bars are still cash-only. Always worth asking.' },
    { scene: 'Paying',          phrase: 'Tenga il resto.',                   translation: 'Keep the change.',                      tip: 'TEHN-gah — a generous gesture Italians appreciate.' },
    { scene: 'Compliments',     phrase: 'Era delizioso, grazie mille!',      translation: 'It was delicious, thank you so much!',  tip: 'DEH-lee-TSYO-so — compliments go a long way here.' },
    { scene: 'Leaving',         phrase: 'Arrivederci, a presto!',            translation: 'Goodbye, see you soon!',                tip: "Ah-ree-veh-DEHR-chee. 'A presto' = until soon." },
  ],
  endMessages: {
    great: "Sei fantastico! You sound like a native. Marco would be proud.",
    good:  "Molto bene! You're ready to order in any Italian bar.",
    ok:    "Buono! A few more rounds and you'll sound like a local.",
    low:   "Non ti preoccupare — every espresso starts as a bean. Keep going!",
  },
  xpReward: 80,
  coinReward: 15,
}
