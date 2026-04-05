/**
 * O Boteco — Brazilian neighborhood bar.
 * Setting: A classic boteco in Rio or São Paulo — plastic chairs, cold beer,
 *           churrasco on the grill, TV showing soccer, neighborhood warmth.
 * Guide: Carla the owner.
 * Culture: Botecos are the heart of Brazilian social life — informal, loud, loving.
 */
import type { PhraseGameConfig } from '../../pages/games/PhraseGame'

export const oBotecoConfig: PhraseGameConfig = {
  name: 'O Boteco',
  langCode: 'pt',
  bcp47: 'pt-BR',
  guide: {
    name: 'Carla',
    role: 'A Dona',
    emoji: '🍺',
    praise: 'Muito bem!',
  },
  theme: {
    bg:      'linear-gradient(180deg,#030d08 0%,#061a0e 60%,#092815 100%)',
    glow1:   '#2d7a3e22',
    glow2:   '#f5c51820',
    primary: '#f5c518',
    muted:   '#4a8a5a',
    card:    'linear-gradient(160deg,#071510cc,#04100acc)',
    border:  '#1a3a22',
    bar:     'linear-gradient(90deg,#2d7a3e,#f5c518)',
  },
  phrases: [
    { scene: 'Arriving',          phrase: 'Boa tarde!',                             translation: 'Good afternoon!',                       tip: "BOH-ah TAR-djee — use from noon onwards. Brazilians are warm." },
    { scene: 'Greeting',          phrase: 'Tudo bem?',                              translation: 'Everything good? (Hi!)',                 tip: "TOO-doo BENG — the most common Brazilian greeting. Say it fast." },
    { scene: 'Responding',        phrase: 'Tudo ótimo, e você?',                    translation: "Everything's great, and you?",          tip: "EH voh-SAY — Brazilians love when foreigners ask back." },
    { scene: 'Finding a table',   phrase: 'Tem mesa disponível?',                   translation: 'Is there a table available?',            tip: 'TENG MEH-zah — botecos are casual, just grab what\'s free.' },
    { scene: 'Ordering drinks',   phrase: 'Uma cerveja gelada, por favor.',         translation: 'A cold beer, please.',                  tip: 'SEHR-veh-zhah zheh-LAH-dah — cold is KEY. Brazilians insist on it.' },
    { scene: 'Ordering drinks',   phrase: 'Uma caipirinha, por favor.',             translation: 'A caipirinha, please.',                  tip: 'Kai-pee-REEN-ya — Brazil\'s national cocktail. Lime + cachaça + sugar.' },
    { scene: 'Ordering drinks',   phrase: 'Um suco de maracujá.',                   translation: 'A passion fruit juice.',                 tip: 'SOO-koo djee mah-rah-koo-ZHAH — Brazilians drink incredible fresh juices.' },
    { scene: 'Ordering food',     phrase: 'Quero um prato feito, por favor.',       translation: "I'd like a set meal, please.",           tip: 'PRAH-too FAY-too — the daily set meal. Cheap, delicious, always full.' },
    { scene: 'Ordering food',     phrase: 'Tem pastéis hoje?',                      translation: 'Do you have pastries today?',            tip: 'Pahs-TAYSH — fried stuffed pastries. Boteco staple food.' },
    { scene: 'Asking the special',phrase: 'Qual é o prato do dia?',                 translation: "What's today's special?",               tip: 'Qual ay oo PRAH-too — always ask. The daily special is usually the best.' },
    { scene: 'Soccer talk',       phrase: 'Que time você torce?',                   translation: 'Which team do you support?',             tip: 'KEH CHEE-mee — this starts a 30-minute conversation in any boteco.' },
    { scene: 'Cheering',          phrase: 'Saúde!',                                 translation: 'Cheers!',                               tip: "SAH-oo-djee — literal meaning: 'health!' Raise your glass." },
    { scene: 'Complimenting',     phrase: 'Está gostoso demais!',                   translation: "It's incredibly delicious!",            tip: 'gos-TOH-zoo djee-MAYS — "demais" means beyond. Carla will love this.' },
    { scene: 'Asking price',      phrase: 'Quanto custa?',                          translation: 'How much does it cost?',                 tip: 'KWAN-too KOOS-tah — always double-check prices at botecos.' },
    { scene: 'Asking price',      phrase: 'Quanto ficou no total?',                 translation: 'How much did it come to in total?',     tip: "Fee-KOH — past tense 'came to'. Natural way to ask the bill amount." },
    { scene: 'Paying',            phrase: 'A conta, por favor.',                    translation: 'The bill, please.',                     tip: 'AH KON-tah — you always have to ask. No one rushes you in Brazil.' },
    { scene: 'Paying',            phrase: 'Aceita cartão?',                         translation: 'Do you accept card?',                   tip: 'AH-say-tah kar-TOWN — many botecos still prefer cash.' },
    { scene: 'Paying',            phrase: 'Pode dividir a conta?',                  translation: 'Can you split the bill?',               tip: 'POH-djee djee-vee-DJEER — splitting is totally normal.' },
    { scene: 'Complimenting',     phrase: 'Foi tudo ótimo, obrigado.',              translation: 'Everything was wonderful, thank you.',  tip: 'FOY — past tense "was." The full compliment when leaving.' },
    { scene: 'Leaving',           phrase: 'Até logo!',                              translation: 'See you later!',                        tip: 'Ah-TEH LOH-go — warm Brazilian farewell. Carla will wave you back.' },
  ],
  endMessages: {
    great: "Fantástico! Carla says you sound like you're from the neighborhood.",
    good:  "Muito bem! You could order, chat, and toast at any boteco in Brazil.",
    ok:    "Bom! A few more rounds and you'll be cheering soccer like a carioca.",
    low:   "Não desista! Every 'saúde' gets you closer. Keep going!",
  },
  xpReward: 80,
  coinReward: 15,
}
