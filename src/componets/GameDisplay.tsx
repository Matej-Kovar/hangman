import type { LetterDisplayState } from "./LetterDisplay"
import WordDisplay from "./WordDisplay"
import "../styles/GameDisplay.css"

type GuessRow = {
    word: string
    states: LetterDisplayState[]
}

type GameDisplayProps = {
    guesses: GuessRow[]
    currentGuess?: string
    showInvalid?: boolean
    maxGuesses?: number
    wordLength?: number
    activeRowIndex?: number
}

const GameDisplay: React.FC<GameDisplayProps> = ({
    guesses,
    currentGuess = "",
    showInvalid = false,
    maxGuesses = 6,
    wordLength = 5,
    activeRowIndex,
}) => {
    const defaultActiveRow = Math.min(guesses.length, maxGuesses - 1)
    const effectiveActiveRow = activeRowIndex ?? defaultActiveRow
    const hasRemainingRow = guesses.length < maxGuesses
    const rowsToRender = Math.max(maxGuesses, guesses.length)

    return (
        <div className="game-display">
            {Array.from({length: rowsToRender}, (_, rowIndex) => {
                const guess = guesses[rowIndex]
                const shouldShowCurrent = !guess && rowIndex === effectiveActiveRow && hasRemainingRow
                const providedStates = guess?.states ?? []
                const rowWord = guess?.word ?? (shouldShowCurrent ? currentGuess : "")
                const rowStates = guess
                    ? Array.from({length: wordLength}, (_, columnIndex) => providedStates[columnIndex] ?? "empty")
                    : Array.from({length: wordLength}, (_, columnIndex) => {
                        if (!shouldShowCurrent) {
                            return "empty" as const
                        }

                        if (showInvalid) {
                            return columnIndex < currentGuess.length ? "invalid" as const : "empty" as const
                        }

                        if (currentGuess.length < wordLength && columnIndex === currentGuess.length) {
                            return "current" as const
                        }

                        return "empty" as const
                    })

                return (
                    <WordDisplay
                        key={`guess-${rowIndex}`}
                        word={rowWord}
                        states={rowStates}
                        wordLength={wordLength}
                    />
                )
            })}
        </div>
    );
}

export type { GameDisplayProps, GuessRow }
export default GameDisplay