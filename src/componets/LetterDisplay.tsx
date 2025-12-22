import "../styles/LetterDisplay.css"

type LetterDisplayProps = {
    state: LetterDisplayState,
    letter: string
}

const LetterDisplay: React.FC<LetterDisplayProps> = ({state, letter}) => {
    return (
        <div className={`default ${state}`}>
            <span>
                {letter}
            </span>
        </div>
    );
}

export type LetterDisplayState = "empty" | "current" | "wrong" | "correct" | "miss" | "invalid"

export default LetterDisplay