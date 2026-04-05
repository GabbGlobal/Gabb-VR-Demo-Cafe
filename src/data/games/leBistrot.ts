/**
 * Le Bistrot — Parisian sidewalk bistrot.
 * Setting: A classic Paris bistrot on a narrow side street, zinc bar, chalkboard menu.
 * Guide: Pierre the waiter.
 * Culture: French café culture — unhurried, wine with lunch, expect attitude with warmth.
 */
import type { PhraseGameConfig } from '../../pages/games/PhraseGame'

export const leBistrotConfig: PhraseGameConfig = {
  name: 'Le Bistrot',
  langCode: 'fr',
  bcp47: 'fr-FR',
  guide: {
    name: 'Pierre',
    role: 'Le Serveur',
    emoji: '🥐',
    praise: 'Magnifique!',
  },
  theme: {
    bg:      'linear-gradient(180deg,#080c14 0%,#0d1520 60%,#112030 100%)',
    glow1:   '#8b1a2e22',
    glow2:   '#3a6b3018',
    primary: '#d4b896',
    muted:   '#5a7060',
    card:    'linear-gradient(160deg,#0e1a28cc,#091220cc)',
    border:  '#1e3040',
    bar:     'linear-gradient(90deg,#8b1a2e,#d4b896)',
  },
  phrases: [
    { scene: 'Arriving',          phrase: 'Bonjour, monsieur.',                     translation: 'Good morning/afternoon, sir.',           tip: "Always say Bonjour first — it\'s mandatory in France." },
    { scene: 'Greeting',          phrase: 'Comment allez-vous?',                    translation: 'How are you? (formal)',                   tip: 'Koh-mahn tah-LAY-voo — formal. Use with strangers.' },
    { scene: 'Getting a table',   phrase: 'Une table pour deux, s\'il vous plaît.', translation: 'A table for two, please.',                tip: 'Seel voo PLAY — formal "please." Never skip this.' },
    { scene: 'Reading the menu',  phrase: 'Le menu, s\'il vous plaît.',             translation: 'The menu, please.',                      tip: 'In France, "le menu" means the fixed-price set meal.' },
    { scene: 'Asking for help',   phrase: 'Qu\'est-ce que vous recommandez?',       translation: 'What do you recommend?',                 tip: 'French waiters take recommendations very seriously.' },
    { scene: 'Ordering drinks',   phrase: 'Un verre de vin rouge, s\'il vous plaît.', translation: 'A glass of red wine, please.',         tip: 'Une carafe d\'eau (water jug) is free — ask any time.' },
    { scene: 'Ordering drinks',   phrase: 'Un café, s\'il vous plaît.',             translation: 'A coffee, please.',                      tip: "French 'café' is espresso — small and strong." },
    { scene: 'Ordering food',     phrase: 'Je voudrais le steak frites.',           translation: 'I would like the steak and fries.',      tip: 'Zhuh voo-DREH — the polite "I would like." Always use this.' },
    { scene: 'Ordering food',     phrase: 'Pour moi, la soupe à l\'oignon.',        translation: 'For me, the onion soup.',                tip: 'Soop ah lon-YON — classic Parisian bistrot dish.' },
    { scene: 'Dietary needs',     phrase: 'Je suis végétarien.',                    translation: 'I am vegetarian.',                      tip: 'Vegetarian options exist but ask — France loves meat.' },
    { scene: 'Checking on food',  phrase: 'Où en est ma commande?',                 translation: 'Where is my order?',                    tip: 'Oo ahn AY — asking without being rude. Very useful.' },
    { scene: 'Tasting',           phrase: 'C\'est délicieux!',                      translation: 'It\'s delicious!',                      tip: 'Say ell DEH-lee-syuh — the biggest compliment possible.' },
    { scene: 'Asking for more',   phrase: 'Encore un peu de pain, s\'il vous plaît.', translation: 'A little more bread, please.',         tip: 'Bread (le pain) is always free at French restaurants.' },
    { scene: 'Asking the time',   phrase: 'Quelle heure est-il?',                   translation: 'What time is it?',                      tip: 'Kel UR ay-TEEL — useful in a bistrot with no clock.' },
    { scene: 'Paying',            phrase: 'L\'addition, s\'il vous plaît.',          translation: 'The bill, please.',                     tip: "LAH-dee-SYOHN — you must ask. It won't come automatically." },
    { scene: 'Paying',            phrase: 'On peut payer par carte?',               translation: 'Can we pay by card?',                   tip: 'Most bistrots take cards now. Worth confirming.' },
    { scene: 'Splitting bill',    phrase: 'On va faire moitié-moitié.',             translation: "We'll split it half and half.",         tip: 'Mwah-TYAY mwah-TYAY — splitting the bill is normal.' },
    { scene: 'Complimenting',     phrase: 'C\'était vraiment excellent.',            translation: 'It was truly excellent.',               tip: "The highest praise in French — Pierre will beam." },
    { scene: 'Getting coat',      phrase: 'Où sont les toilettes?',                 translation: 'Where are the bathrooms?',              tip: 'Always useful to know on the way out.' },
    { scene: 'Leaving',           phrase: 'Merci, à bientôt!',                      translation: 'Thank you, see you soon!',              tip: 'Ah byahn-TOH — "until soon." Pierre will appreciate it.' },
  ],
  endMessages: {
    great: "Magnifique! Pierre says you have the accent of someone who grew up near the Seine.",
    good:  "Très bien! You could navigate any Paris bistrot with ease.",
    ok:    "Bien! A few more rounds and you'll be chatting with Parisians.",
    low:   "Courage! Even Parisians struggle sometimes. You've got this.",
  },
  xpReward: 80,
  coinReward: 15,
}
