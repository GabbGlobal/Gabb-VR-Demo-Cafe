/**
 * El Mercado — Spanish open-air market.
 * Setting: A La Boqueria-style market in Madrid or Barcelona.
 * Guide: Sofia the market vendor.
 * Culture: Haggling, fresh produce, tapas counters, loud and warm energy.
 */
import type { PhraseGameConfig } from '../../pages/games/PhraseGame'

export const elMercadoConfig: PhraseGameConfig = {
  name: 'El Mercado',
  langCode: 'es',
  bcp47: 'es-ES',
  guide: {
    name: 'Sofía',
    role: 'La Vendedora',
    emoji: '🥘',
    praise: '¡Muy bien!',
  },
  theme: {
    bg:      'linear-gradient(180deg,#0d0700 0%,#1a0e05 60%,#2d1a08 100%)',
    glow1:   '#d4532a20',
    glow2:   '#f0a50018',
    primary: '#f0a500',
    muted:   '#8a5c2a',
    card:    'linear-gradient(160deg,#231205cc,#1a0d04cc)',
    border:  '#3d2010',
    bar:     'linear-gradient(90deg,#d4532a,#f0a500)',
  },
  phrases: [
    { scene: 'Arriving',          phrase: '¡Buenos días!',                        translation: 'Good morning!',                          tip: "BWAY-nos DEE-as — the warmest Spanish greeting." },
    { scene: 'Greeting',          phrase: '¿Cómo está usted?',                    translation: 'How are you? (formal)',                   tip: '"Usted" is formal — use with vendors and older people.' },
    { scene: 'Browsing',          phrase: '¿Qué me recomienda hoy?',              translation: 'What do you recommend today?',            tip: 'Vendors LOVE this question — expect a passionate answer.' },
    { scene: 'Asking about items',phrase: '¿Qué es esto?',                        translation: 'What is this?',                          tip: 'KAY es ES-to — point at anything unfamiliar.' },
    { scene: 'Fresh produce',     phrase: 'Quiero medio kilo de tomates, por favor.', translation: 'I want half a kilo of tomatoes, please.',tip: 'KY-eh-ro — "I want." Polite when said with a smile.' },
    { scene: 'Ordering tapas',    phrase: 'Póngame una ración de jamón.',         translation: 'Give me a portion of ham.',              tip: 'PON-ga-me — classic market ordering phrase.' },
    { scene: 'Ordering tapas',    phrase: 'Una caña, por favor.',                 translation: 'A small beer, please.',                  tip: 'CAN-ya — the standard small draft beer in Spain.' },
    { scene: 'Asking freshness',  phrase: '¿Son frescos?',                        translation: 'Are they fresh?',                        tip: 'A perfectly normal question at any Spanish market stall.' },
    { scene: 'Checking price',    phrase: '¿Cuánto cuesta?',                      translation: 'How much does it cost?',                 tip: 'KWAN-to KWES-ta — most useful Spanish phrase ever.' },
    { scene: 'Checking price',    phrase: '¿Cuánto es en total?',                 translation: 'How much is it in total?',               tip: 'Use this when buying from multiple stalls.' },
    { scene: 'Asking discount',   phrase: '¿Me hace un descuento?',               translation: 'Can you give me a discount?',            tip: 'MEH ah-seh — politely asking for a deal. Works often!' },
    { scene: 'Comparing',         phrase: 'Este es más barato.',                  translation: 'This one is cheaper.',                   tip: 'ES-teh es mas bah-RAH-to — great for comparison.' },
    { scene: 'Buying more',       phrase: 'Me llevo dos, por favor.',             translation: "I'll take two, please.",                 tip: 'MEH YEH-vo — "I take with me" — natural Spanish.' },
    { scene: 'Not interested',    phrase: 'Solo estoy mirando, gracias.',         translation: 'I\'m just looking, thanks.',             tip: 'SOH-lo es-TOY — saves you from pressure sales.' },
    { scene: 'Too expensive',     phrase: 'Es un poco caro para mí.',             translation: "It's a bit expensive for me.",           tip: 'ES oon POH-ko KAH-ro — politely declining without offending.' },
    { scene: 'Paying',            phrase: 'Aquí tiene, gracias.',                 translation: 'Here you go, thank you.',                tip: 'AH-kee TYEH-neh — hand over money with this phrase.' },
    { scene: 'Paying',            phrase: '¿Tiene cambio?',                       translation: 'Do you have change?',                   tip: 'TYEH-neh KAM-byo — essential for cash markets.' },
    { scene: 'Complimenting',     phrase: '¡Está riquísimo!',                     translation: "It's absolutely delicious!",             tip: 'Ree-KEE-see-mo — the MOST delicious. Vendors beam at this.' },
    { scene: 'Returning',         phrase: 'Volveré mañana.',                      translation: "I'll come back tomorrow.",               tip: 'The highest compliment you can give a market vendor.' },
    { scene: 'Leaving',           phrase: '¡Hasta luego, que tenga un buen día!', translation: 'Goodbye, have a great day!',            tip: 'AHS-ta LWEH-go — warm, full farewell. Very Spanish.' },
  ],
  endMessages: {
    great: "¡Increíble! Sofía says you sound like you grew up in Madrid.",
    good:  "¡Muy bien! You could shop the Boqueria with confidence.",
    ok:    "¡Bueno! A few more rounds at the market and you'll be a pro.",
    low:   "¡Ánimo! Every language starts with one word. Keep practicing.",
  },
  xpReward: 80,
  coinReward: 15,
}
