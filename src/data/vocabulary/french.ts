import type { VocabWord } from '../../types'

export const frenchVocabulary: VocabWord[] = [
  { id:'fr-001', native:'bonjour', translation:'hello / good day', pronunciation:'bon-ZHOOR', example:'Bonjour, comment allez-vous?', exampleTranslation:'Hello, how are you?', category:'essentials', tags:['greeting','formal'], difficulty:1 },
  { id:'fr-002', native:'bonsoir', translation:'good evening', pronunciation:'bon-SWAHR', example:'Bonsoir, bienvenue!', exampleTranslation:'Good evening, welcome!', category:'essentials', tags:['greeting'], difficulty:1 },
  { id:'fr-003', native:'salut', translation:'hi / bye (informal)', pronunciation:'sa-LÜ', example:'Salut, ça va?', exampleTranslation:'Hi, how\'s it going?', category:'essentials', tags:['greeting','informal'], difficulty:1 },
  { id:'fr-004', native:'s\'il vous plaît', translation:'please (formal)', pronunciation:'sil voo PLEH', example:'Un café, s\'il vous plaît.', exampleTranslation:'A coffee, please.', category:'essentials', tags:['polite','formal'], difficulty:1 },
  { id:'fr-005', native:'merci', translation:'thank you', pronunciation:'mer-SI', example:'Merci beaucoup!', exampleTranslation:'Thank you very much!', category:'essentials', tags:['polite'], difficulty:1 },
  { id:'fr-006', native:'de rien', translation:'you\'re welcome', pronunciation:'de RYEN', example:'Merci! — De rien!', exampleTranslation:'Thank you! — You\'re welcome!', category:'essentials', tags:['polite'], difficulty:1 },
  { id:'fr-007', native:'excusez-moi', translation:'excuse me', pronunciation:'ex-kü-ZAY mwa', example:'Excusez-moi, où est la gare?', exampleTranslation:'Excuse me, where is the station?', category:'essentials', tags:['polite'], difficulty:1 },
  { id:'fr-008', native:'je ne comprends pas', translation:'I don\'t understand', pronunciation:'zhe ne kom-PRAN pa', example:'Désolé, je ne comprends pas.', exampleTranslation:'Sorry, I don\'t understand.', category:'essentials', tags:['communication'], difficulty:2 },
  { id:'fr-009', native:'je m\'appelle', translation:'my name is', pronunciation:'zhe ma-PEL', example:'Je m\'appelle Sophie.', exampleTranslation:'My name is Sophie.', category:'essentials', tags:['introduction'], difficulty:1 },
  { id:'fr-010', native:'oui / non', translation:'yes / no', pronunciation:'WEE / NON', example:'Oui, c\'est correct.', exampleTranslation:'Yes, that\'s correct.', category:'essentials', tags:['basic'], difficulty:1 },
  // Travel
  { id:'fr-101', native:'aéroport', translation:'airport', pronunciation:'ae-ro-POR', example:'L\'aéroport est loin d\'ici.', exampleTranslation:'The airport is far from here.', category:'travel', tags:['transport'], difficulty:1 },
  { id:'fr-102', native:'gare', translation:'train station', pronunciation:'GAR', example:'La gare est à cinq minutes.', exampleTranslation:'The station is five minutes away.', category:'travel', tags:['transport'], difficulty:1 },
  { id:'fr-103', native:'à gauche', translation:'to the left', pronunciation:'a GOSH', example:'Tournez à gauche.', exampleTranslation:'Turn left.', category:'travel', tags:['directions'], difficulty:1 },
  { id:'fr-104', native:'à droite', translation:'to the right', pronunciation:'a DRWAT', example:'C\'est à droite.', exampleTranslation:'It\'s on the right.', category:'travel', tags:['directions'], difficulty:1 },
  { id:'fr-105', native:'où est?', translation:'where is?', pronunciation:'OO eh', example:'Où est le musée du Louvre?', exampleTranslation:'Where is the Louvre museum?', category:'travel', tags:['directions'], difficulty:1 },
  // Food
  { id:'fr-201', native:'restaurant', translation:'restaurant', pronunciation:'res-to-RAN', example:'Je réserve une table au restaurant.', exampleTranslation:'I\'m booking a table at the restaurant.', category:'food', tags:['dining'], difficulty:1 },
  { id:'fr-202', native:'l\'addition', translation:'the bill', pronunciation:'la-di-SYON', example:'L\'addition, s\'il vous plaît!', exampleTranslation:'The bill, please!', category:'food', tags:['dining'], difficulty:2 },
  { id:'fr-203', native:'c\'est délicieux', translation:'it\'s delicious', pronunciation:'se de-li-SYÖ', example:'C\'est délicieux! Félicitations au chef.', exampleTranslation:'It\'s delicious! Congratulations to the chef.', category:'food', tags:['food'], difficulty:2 },
  { id:'fr-204', native:'végétarien/ne', translation:'vegetarian', pronunciation:'ve-zhe-ta-RYEN', example:'Je suis végétarienne.', exampleTranslation:'I am vegetarian.', category:'food', tags:['dietary'], difficulty:2 },
  // LGBTQ+
  { id:'fr-501', native:'partenaire', translation:'partner', pronunciation:'par-te-NEHR', example:'Voici mon partenaire.', exampleTranslation:'This is my partner.', category:'lgbtq', tags:['relationships','lgbtq'], difficulty:1 },
  { id:'fr-502', native:'la fierté', translation:'pride', pronunciation:'la fyer-TE', example:'La marche des fiertés est samedi.', exampleTranslation:'The pride march is on Saturday.', category:'lgbtq', tags:['lgbtq'], difficulty:2 },
  { id:'fr-503', native:'gay / lesbienne', translation:'gay / lesbian', pronunciation:'GAY / les-BYEN', example:'Nous sommes un couple gay.', exampleTranslation:'We are a gay couple.', category:'lgbtq', tags:['identity','lgbtq'], difficulty:1 },
  { id:'fr-504', native:'pronoms', translation:'pronouns', pronunciation:'pro-NOM', example:'Quels sont vos pronoms?', exampleTranslation:'What are your pronouns?', category:'lgbtq', tags:['lgbtq','identity'], difficulty:2 },
  // Romance
  { id:'fr-601', native:'je t\'aime', translation:'I love you', pronunciation:'zhe TEM', example:'Je t\'aime de tout mon cœur.', exampleTranslation:'I love you with all my heart.', category:'romance', tags:['romance','love'], difficulty:1 },
  { id:'fr-602', native:'tu es magnifique', translation:'you are magnificent', pronunciation:'tü eh ma-ni-FIK', example:'Tu es magnifique ce soir.', exampleTranslation:'You are magnificent tonight.', category:'romance', tags:['compliments','romance'], difficulty:2 },
  { id:'fr-603', native:'tu me manques', translation:'I miss you', pronunciation:'tü me MANK', example:'Tu me manques tellement.', exampleTranslation:'I miss you so much.', category:'romance', tags:['romance'], difficulty:2 },
  // Emergency
  { id:'fr-951', native:'au secours', translation:'help!', pronunciation:'o se-KOOR', example:'Au secours! Appelez la police!', exampleTranslation:'Help! Call the police!', category:'emergency', tags:['emergency'], difficulty:1 },
  { id:'fr-952', native:'urgence', translation:'emergency', pronunciation:'ür-ZHANS', example:'C\'est une urgence médicale.', exampleTranslation:'It\'s a medical emergency.', category:'emergency', tags:['emergency'], difficulty:2 },
]
