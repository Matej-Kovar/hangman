import type { LetterDisplayState } from "./LetterDisplay"
import LetterDisplay from "./LetterDisplay"
import "../styles/WordDisplay.css"

type WordDisplayProps = {
    word: string
    states: LetterDisplayState[]
    wordLength?: number
}

const WordDisplay: React.FC<WordDisplayProps> = ({word, states, wordLength}) => {
    const displayLength = wordLength ?? Math.max(word.length, states.length, 5)
    const letters = Array.from({length: displayLength}, (_, index) => word[index] ?? "")
    const letterStates = Array.from({length: displayLength}, (_, index) => states[index] ?? "empty") as LetterDisplayState[]

    return (
        <div className="word-container">
            {letters.map((letter, index) => (
                <LetterDisplay
                    key={`letter-${index}`}
                    letter={letter}
                    state={letterStates[index]}
                />
            ))}
        </div>
    );
}

export type { WordDisplayProps }
export default WordDisplay