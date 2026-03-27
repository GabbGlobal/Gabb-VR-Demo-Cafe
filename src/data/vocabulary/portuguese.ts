import type { VocabWord } from '../../types'

export const portugueseVocabulary: VocabWord[] = [
  { id:'pt-001', native:'olá', translation:'hello', pronunciation:'o-LA', example:'Olá! Tudo bem?', exampleTranslation:'Hello! Everything OK?', category:'essentials', tags:['greeting'], difficulty:1 },
  { id:'pt-002', native:'bom dia', translation:'good morning', pronunciation:'bom JI-a', example:'Bom dia, como vai?', exampleTranslation:'Good morning, how are you?', category:'essentials', tags:['greeting'], difficulty:1 },
  { id:'pt-003', native:'boa tarde', translation:'good afternoon', pronunciation:'BO-a TAR-je', example:'Boa tarde, tudo bem?', exampleTranslation:'Good afternoon, all well?', category:'essentials', tags:['greeting'], difficulty:1 },
  { id:'pt-004', native:'boa noite', translation:'good night', pronunciation:'BO-a NOI-te', example:'Boa noite, até amanhã!', exampleTranslation:'Good night, see you tomorrow!', category:'essentials', tags:['greeting'], difficulty:1 },
  { id:'pt-005', native:'por favor', translation:'please', pronunciation:'por fa-VOR', example:'Uma água, por favor.', exampleTranslation:'A water, please.', category:'essentials', tags:['polite'], difficulty:1 },
  { id:'pt-006', native:'obrigado / obrigada', translation:'thank you (m/f)', pronunciation:'o-bri-GA-do', example:'Muito obrigada!', exampleTranslation:'Thank you very much!', category:'essentials', tags:['polite'], difficulty:1 },
  { id:'pt-007', native:'de nada', translation:'you\'re welcome', pronunciation:'de NA-da', example:'Obrigado! — De nada!', exampleTranslation:'Thank you! — You\'re welcome!', category:'essentials', tags:['polite'], difficulty:1 },
  { id:'pt-008', native:'com licença', translation:'excuse me', pronunciation:'kom li-SEN-sa', example:'Com licença, onde é o banheiro?', exampleTranslation:'Excuse me, where is the bathroom?', category:'essentials', tags:['polite'], difficulty:1 },
  { id:'pt-009', native:'não entendo', translation:'I don\'t understand', pronunciation:'naum en-TEN-do', example:'Desculpe, não entendo.', exampleTranslation:'Sorry, I don\'t understand.', category:'essentials', tags:['communication'], difficulty:1 },
  { id:'pt-010', native:'meu nome é', translation:'my name is', pronunciation:'mew NO-me e', example:'Meu nome é Ana.', exampleTranslation:'My name is Ana.', category:'essentials', tags:['introduction'], difficulty:1 },
  // Travel
  { id:'pt-101', native:'aeroporto', translation:'airport', pronunciation:'ae-ro-POR-to', example:'Preciso ir ao aeroporto.', exampleTranslation:'I need to go to the airport.', category:'travel', tags:['transport'], difficulty:1 },
  { id:'pt-102', native:'hotel', translation:'hotel', pronunciation:'o-TEW', example:'Tenho reserva no hotel.', exampleTranslation:'I have a reservation at the hotel.', category:'travel', tags:['accommodation'], difficulty:1 },
  { id:'pt-103', native:'esquerda', translation:'left', pronunciation:'es-KER-da', example:'Vire à esquerda.', exampleTranslation:'Turn left.', category:'travel', tags:['directions'], difficulty:1 },
  { id:'pt-104', native:'direita', translation:'right', pronunciation:'di-REI-ta', example:'É à direita.', exampleTranslation:'It\'s on the right.', category:'travel', tags:['directions'], difficulty:1 },
  { id:'pt-105', native:'onde fica?', translation:'where is?', pronunciation:'ON-de FI-ka', example:'Onde fica o metrô?', exampleTranslation:'Where is the metro?', category:'travel', tags:['directions'], difficulty:1 },
  // Food
  { id:'pt-201', native:'restaurante', translation:'restaurant', pronunciation:'hes-tau-RAN-te', example:'Conhece um bom restaurante?', exampleTranslation:'Do you know a good restaurant?', category:'food', tags:['dining'], difficulty:1 },
  { id:'pt-202', native:'a conta', translation:'the bill', pronunciation:'a KON-ta', example:'A conta, por favor!', exampleTranslation:'The bill, please!', category:'food', tags:['dining'], difficulty:1 },
  { id:'pt-203', native:'delicioso', translation:'delicious', pronunciation:'de-li-SYO-zo', example:'Está delicioso!', exampleTranslation:'It\'s delicious!', category:'food', tags:['food'], difficulty:2 },
  { id:'pt-204', native:'vegetariano/a', translation:'vegetarian', pronunciation:'ve-zhe-ta-RYA-no', example:'Sou vegetariana.', exampleTranslation:'I am vegetarian.', category:'food', tags:['dietary'], difficulty:2 },
  // LGBTQ+
  { id:'pt-501', native:'parceiro/a', translation:'partner', pronunciation:'par-SEI-ro', example:'Este é meu parceiro.', exampleTranslation:'This is my partner.', category:'lgbtq', tags:['relationships','lgbtq'], difficulty:1 },
  { id:'pt-502', native:'parada do orgulho', translation:'pride parade', pronunciation:'pa-RA-da do or-GU-lyo', example:'A parada do orgulho é incrível!', exampleTranslation:'The pride parade is amazing!', category:'lgbtq', tags:['lgbtq'], difficulty:2 },
  { id:'pt-503', native:'gay / lésbica', translation:'gay / lesbian', pronunciation:'GAY / LEZ-bi-ka', example:'Somos um casal gay.', exampleTranslation:'We are a gay couple.', category:'lgbtq', tags:['identity','lgbtq'], difficulty:1 },
  { id:'pt-504', native:'pronomes', translation:'pronouns', pronunciation:'pro-NO-mes', example:'Quais são seus pronomes?', exampleTranslation:'What are your pronouns?', category:'lgbtq', tags:['lgbtq','identity'], difficulty:2 },
  // Romance
  { id:'pt-601', native:'eu te amo', translation:'I love you', pronunciation:'ew te A-mo', example:'Eu te amo muito.', exampleTranslation:'I love you very much.', category:'romance', tags:['romance','love'], difficulty:1 },
  { id:'pt-602', native:'você é lindo/a', translation:'you are beautiful', pronunciation:'vo-SE e LIN-do', example:'Você é linda esta noite.', exampleTranslation:'You are beautiful tonight.', category:'romance', tags:['compliments','romance'], difficulty:2 },
  { id:'pt-603', native:'saudade', translation:'longing / missing someone', pronunciation:'saw-DA-de', example:'Tenho saudade de você.', exampleTranslation:'I miss you (with longing).', category:'romance', tags:['romance'], difficulty:2 },
  // Emergency
  { id:'pt-951', native:'socorro', translation:'help!', pronunciation:'so-KO-ho', example:'Socorro! Chame a polícia!', exampleTranslation:'Help! Call the police!', category:'emergency', tags:['emergency'], difficulty:1 },
  { id:'pt-952', native:'emergência', translation:'emergency', pronunciation:'e-mer-ZHEN-sya', example:'É uma emergência médica.', exampleTranslation:'It\'s a medical emergency.', category:'emergency', tags:['emergency'], difficulty:2 },
]
