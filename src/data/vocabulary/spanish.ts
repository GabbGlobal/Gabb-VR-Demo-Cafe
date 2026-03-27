import type { VocabWord } from '../../types'

export const spanishVocabulary: VocabWord[] = [
  // ── ESSENTIALS ────────────────────────────────────────────────────────────
  { id:'es-001', native:'hola', translation:'hello', pronunciation:'O-la', example:'¡Hola! ¿Cómo estás?', exampleTranslation:'Hello! How are you?', category:'essentials', tags:['greeting'], difficulty:1 },
  { id:'es-002', native:'buenos días', translation:'good morning', pronunciation:'BWEH-nos DI-as', example:'Buenos días, ¿cómo amaneció?', exampleTranslation:'Good morning, how did you wake up?', category:'essentials', tags:['greeting','formal'], difficulty:1 },
  { id:'es-003', native:'buenas tardes', translation:'good afternoon', pronunciation:'BWEH-nas TAR-des', example:'Buenas tardes, señor.', exampleTranslation:'Good afternoon, sir.', category:'essentials', tags:['greeting','formal'], difficulty:1 },
  { id:'es-004', native:'buenas noches', translation:'good night', pronunciation:'BWEH-nas NO-ches', example:'¡Buenas noches, hasta mañana!', exampleTranslation:'Good night, see you tomorrow!', category:'essentials', tags:['greeting'], difficulty:1 },
  { id:'es-005', native:'por favor', translation:'please', pronunciation:'por fa-VOR', example:'Un café, por favor.', exampleTranslation:'A coffee, please.', category:'essentials', tags:['polite'], difficulty:1 },
  { id:'es-006', native:'gracias', translation:'thank you', pronunciation:'GRA-sias', example:'¡Muchas gracias!', exampleTranslation:'Thank you very much!', category:'essentials', tags:['polite'], difficulty:1 },
  { id:'es-007', native:'de nada', translation:'you\'re welcome', pronunciation:'de NA-da', example:'Gracias. — ¡De nada!', exampleTranslation:'Thank you. — You\'re welcome!', category:'essentials', tags:['polite'], difficulty:1 },
  { id:'es-008', native:'perdón / disculpe', translation:'sorry / excuse me', pronunciation:'per-DON', example:'Disculpe, ¿dónde está el baño?', exampleTranslation:'Excuse me, where is the bathroom?', category:'essentials', tags:['polite'], difficulty:1 },
  { id:'es-009', native:'sí', translation:'yes', pronunciation:'SI', example:'Sí, entiendo.', exampleTranslation:'Yes, I understand.', category:'essentials', tags:['basic'], difficulty:1 },
  { id:'es-010', native:'no', translation:'no', pronunciation:'NO', example:'No, gracias.', exampleTranslation:'No, thank you.', category:'essentials', tags:['basic'], difficulty:1 },
  { id:'es-011', native:'me llamo', translation:'my name is', pronunciation:'me YA-mo', example:'Me llamo Carlos.', exampleTranslation:'My name is Carlos.', category:'essentials', tags:['introduction'], difficulty:1 },
  { id:'es-012', native:'¿cómo te llamas?', translation:'what is your name?', pronunciation:'KO-mo te YA-mas', example:'¿Cómo te llamas?', exampleTranslation:'What is your name?', category:'essentials', tags:['introduction'], difficulty:1 },
  { id:'es-013', native:'no entiendo', translation:'I don\'t understand', pronunciation:'no en-TYEN-do', example:'Lo siento, no entiendo.', exampleTranslation:'I\'m sorry, I don\'t understand.', category:'essentials', tags:['communication'], difficulty:1 },
  { id:'es-014', native:'¿habla inglés?', translation:'do you speak English?', pronunciation:'A-bla in-GLES', example:'¿Habla inglés, por favor?', exampleTranslation:'Do you speak English, please?', category:'essentials', tags:['communication'], difficulty:2 },
  // Numbers
  { id:'es-015', native:'uno', translation:'one', pronunciation:'OO-no', example:'Un billete, por favor.', exampleTranslation:'One ticket, please.', category:'essentials', tags:['numbers'], difficulty:1 },
  { id:'es-016', native:'dos', translation:'two', pronunciation:'DOS', example:'Mesa para dos.', exampleTranslation:'Table for two.', category:'essentials', tags:['numbers'], difficulty:1 },
  { id:'es-017', native:'diez', translation:'ten', pronunciation:'DYEZ', example:'Diez euros.', exampleTranslation:'Ten euros.', category:'essentials', tags:['numbers'], difficulty:1 },
  // Travel
  { id:'es-101', native:'aeropuerto', translation:'airport', pronunciation:'ae-ro-PWER-to', example:'¿Cómo llego al aeropuerto?', exampleTranslation:'How do I get to the airport?', category:'travel', tags:['transport'], difficulty:1 },
  { id:'es-102', native:'hotel', translation:'hotel', pronunciation:'o-TEL', example:'Tengo una reserva en el hotel.', exampleTranslation:'I have a reservation at the hotel.', category:'travel', tags:['accommodation'], difficulty:1 },
  { id:'es-103', native:'izquierda', translation:'left', pronunciation:'is-KWYER-da', example:'Gira a la izquierda.', exampleTranslation:'Turn left.', category:'travel', tags:['directions'], difficulty:1 },
  { id:'es-104', native:'derecha', translation:'right', pronunciation:'de-RE-cha', example:'Está a la derecha.', exampleTranslation:'It\'s on the right.', category:'travel', tags:['directions'], difficulty:1 },
  { id:'es-105', native:'¿dónde está?', translation:'where is?', pronunciation:'DON-de es-TA', example:'¿Dónde está el metro?', exampleTranslation:'Where is the metro?', category:'travel', tags:['directions'], difficulty:1 },
  // Food
  { id:'es-201', native:'restaurante', translation:'restaurant', pronunciation:'res-tau-RAN-te', example:'¿Me recomienda un restaurante?', exampleTranslation:'Can you recommend a restaurant?', category:'food', tags:['dining'], difficulty:1 },
  { id:'es-202', native:'la cuenta', translation:'the bill', pronunciation:'la KWEN-ta', example:'¡La cuenta, por favor!', exampleTranslation:'The bill, please!', category:'food', tags:['dining'], difficulty:1 },
  { id:'es-203', native:'delicioso', translation:'delicious', pronunciation:'de-li-SYO-so', example:'¡Está delicioso!', exampleTranslation:'It\'s delicious!', category:'food', tags:['food'], difficulty:2 },
  { id:'es-204', native:'vegetariano/a', translation:'vegetarian', pronunciation:'ve-he-ta-RYA-no', example:'Soy vegetariana.', exampleTranslation:'I am vegetarian.', category:'food', tags:['dietary'], difficulty:2 },
  // LGBTQ+
  { id:'es-501', native:'pareja', translation:'partner / couple', pronunciation:'pa-RE-ha', example:'Ella es mi pareja.', exampleTranslation:'She is my partner.', category:'lgbtq', tags:['relationships','lgbtq'], difficulty:1 },
  { id:'es-502', native:'orgullo', translation:'pride', pronunciation:'or-GU-yo', example:'El desfile del orgullo es hoy.', exampleTranslation:'The pride parade is today.', category:'lgbtq', tags:['lgbtq'], difficulty:2 },
  { id:'es-503', native:'gay / lesbiana', translation:'gay / lesbian', pronunciation:'gay / les-BYA-na', example:'Somos una pareja lesbiana.', exampleTranslation:'We are a lesbian couple.', category:'lgbtq', tags:['identity','lgbtq'], difficulty:1 },
  { id:'es-504', native:'pronombres', translation:'pronouns', pronunciation:'pro-NOM-bres', example:'¿Cuáles son tus pronombres?', exampleTranslation:'What are your pronouns?', category:'lgbtq', tags:['lgbtq','identity'], difficulty:2 },
  // Romance
  { id:'es-601', native:'te quiero', translation:'I love you / I like you', pronunciation:'te KYER-o', example:'Te quiero mucho.', exampleTranslation:'I love you very much.', category:'romance', tags:['romance','love'], difficulty:1 },
  { id:'es-602', native:'te amo', translation:'I love you (deeply)', pronunciation:'te A-mo', example:'Te amo con toda mi alma.', exampleTranslation:'I love you with all my soul.', category:'romance', tags:['romance','love'], difficulty:1 },
  { id:'es-603', native:'eres muy guapo/a', translation:'you are very handsome/beautiful', pronunciation:'E-res mwi GWA-po', example:'Eres muy guapa esta noche.', exampleTranslation:'You are very beautiful tonight.', category:'romance', tags:['compliments','romance'], difficulty:2 },
  { id:'es-604', native:'¿quieres salir conmigo?', translation:'do you want to go out with me?', pronunciation:'KYER-es sa-LIR kon-MI-go', example:'¿Quieres salir conmigo esta noche?', exampleTranslation:'Do you want to go out with me tonight?', category:'romance', tags:['dating','romance'], difficulty:2 },
  // Emergency
  { id:'es-951', native:'ayuda', translation:'help', pronunciation:'a-YOO-da', example:'¡Ayuda! Necesito ayuda.', exampleTranslation:'Help! I need help.', category:'emergency', tags:['emergency'], difficulty:1 },
  { id:'es-952', native:'policía', translation:'police', pronunciation:'po-li-SI-a', example:'¡Llame a la policía!', exampleTranslation:'Call the police!', category:'emergency', tags:['emergency'], difficulty:1 },
]
