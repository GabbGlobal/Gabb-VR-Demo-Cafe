/**
 * Bar Roma — Italian espresso bar pronunciation drill.
 * Now powered by the shared PhraseGame engine.
 * Route stays /games/caffe-roma for backward compatibility.
 */
import PhraseGame from './PhraseGame'
import { barRomaConfig } from '../../data/games/barRoma'

export default function CaffeRomaPage() {
  return <PhraseGame config={barRomaConfig} />
}
