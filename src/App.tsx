import { useEffect, useRef, useState } from "react"
import GameDisplay, { type GuessRow } from "./componets/GameDisplay"
import type { LetterDisplayState } from "./componets/LetterDisplay"
import wordsData from "./assets/words_5_common.txt?raw"
import "./App.css"

const WORD_LENGTH = 5
const MAX_GUESSES = 6
const KEYBOARD_LAYOUT: string[][] = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACK"],
  ["Á", "Č", "Ď", "É", "Ě", "Í", "Ň", "Ó", "Ř", "Š", "Ť", "Ú", "Ů", "Ý", "Ž"],
]
const FALLBACK_WORDS = [
  "APPLE",
  "GRAPE",
  "MANGO",
  "PEACH",
  "LEMON",
  "BERRY",
  "CHILI",
  "OLIVE",
]
const RAW_WORDS = wordsData.split(/\r?\n/)
const NORMALIZED_WORDS = Array.from(
  new Set(
    RAW_WORDS
      .map(word => word.trim())
      .filter(word => word.length === WORD_LENGTH)
      .map(word => word.toLocaleUpperCase("cs-CZ")),
  ),
)
const WORD_LIST = NORMALIZED_WORDS.length > 0 ? NORMALIZED_WORDS : FALLBACK_WORDS
const WORD_SET = new Set(WORD_LIST)
const LETTER_PATTERN = /^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]$/

type GameStatus = "playing" | "won" | "lost"

const pickRandomWord = (): string => {
  return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]
}

const scoreGuess = (guess: string, answer: string): LetterDisplayState[] => {
  const result: LetterDisplayState[] = Array<LetterDisplayState>(WORD_LENGTH).fill("wrong")
  const frequency: Record<string, number> = {}

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    const solutionChar = answer[index]
    if (guess[index] === solutionChar) {
      result[index] = "correct"
    } else {
      frequency[solutionChar] = (frequency[solutionChar] ?? 0) + 1
    }
  }

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (result[index] === "correct") {
      continue
    }

    const letter = guess[index]
    if (!letter) {
      continue
    }

    const available = frequency[letter] ?? 0
    if (available > 0) {
      result[index] = "miss"
      frequency[letter] = available - 1
    }
  }

  return result
}

const getStatePriority = (state: LetterDisplayState): number => {
  switch (state) {
    case "correct":
      return 3
    case "wrong":
      return 2
    case "miss":
      return 1
    default:
      return 0
  }
}

const App: React.FC = () => {
  const [solution, setSolution] = useState<string>(() => pickRandomWord())
  const [guesses, setGuesses] = useState<GuessRow[]>([])
  const [currentGuess, setCurrentGuess] = useState<string>("")
  const [keyboardStates, setKeyboardStates] = useState<Record<string, LetterDisplayState>>({})
  const [statusMessage, setStatusMessage] = useState<string>("")
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing")
  const [showInvalid, setShowInvalid] = useState<boolean>(false)
  const invalidTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (invalidTimerRef.current !== null) {
        window.clearTimeout(invalidTimerRef.current)
      }
    }
  }, [])

  const setInvalidFeedback = (message: string) => {
    setStatusMessage(message)
    setShowInvalid(true)
    if (invalidTimerRef.current !== null) {
      window.clearTimeout(invalidTimerRef.current)
    }
    invalidTimerRef.current = window.setTimeout(() => {
      setShowInvalid(false)
      invalidTimerRef.current = null
    }, 700)
  }

  const updateKeyboardStates = (guess: string, states: LetterDisplayState[]) => {
    setKeyboardStates(previous => {
      const next = {...previous}
      states.forEach((state, index) => {
        const letter = guess[index]
        if (!letter) {
          return
        }
        if (state !== "correct" && state !== "wrong" && state !== "miss") {
          return
        }
        const existing = next[letter]
        if (!existing || getStatePriority(state) >= getStatePriority(existing)) {
          next[letter] = state
        }
      })
      return next
    })
  }

  const handleLetterInput = (letter: string) => {
    if (gameStatus !== "playing") {
      return
    }
    if (currentGuess.length >= WORD_LENGTH) {
      return
    }
    const normalizedLetter = letter.toLocaleUpperCase("cs-CZ")
    if (!LETTER_PATTERN.test(normalizedLetter)) {
      return
    }
    setCurrentGuess(previous => `${previous}${normalizedLetter}`)
    setStatusMessage("")
    setShowInvalid(false)
  }

  const handleDelete = () => {
    if (gameStatus !== "playing") {
      return
    }
    if (currentGuess.length === 0) {
      return
    }
    setCurrentGuess(previous => previous.slice(0, -1))
    setStatusMessage("")
    setShowInvalid(false)
  }

  const handleSubmit = () => {
    if (gameStatus !== "playing") {
      return
    }
    if (currentGuess.length < WORD_LENGTH) {
      setInvalidFeedback("Nedostatek písmen")
      return
    }

    const uppercaseGuess = currentGuess.toLocaleUpperCase("cs-CZ")
    if (!WORD_SET.has(uppercaseGuess)) {
      setInvalidFeedback("Slovo není v seznamu")
      return
    }

    const states = scoreGuess(uppercaseGuess, solution)
    const nextGuess: GuessRow = {word: uppercaseGuess, states}
    const updatedGuesses = [...guesses, nextGuess]

    updateKeyboardStates(uppercaseGuess, states)
    setGuesses(updatedGuesses)
    setCurrentGuess("")
    setShowInvalid(false)

    if (uppercaseGuess === solution) {
      setGameStatus("won")
      setStatusMessage("Správně!")
      return
    }

    if (updatedGuesses.length >= MAX_GUESSES) {
      setGameStatus("lost")
      setStatusMessage(`Slovo bylo: ${solution}`)
      return
    }

    setStatusMessage("")
  }

  const handleKeyPress = (value: string) => {
    if (value === "ENTER") {
      handleSubmit()
      return
    }
    if (value === "BACK") {
      handleDelete()
      return
    }
    handleLetterInput(value)
  }

  const resetGame = () => {
    if (invalidTimerRef.current !== null) {
      window.clearTimeout(invalidTimerRef.current)
      invalidTimerRef.current = null
    }
    setGuesses([])
    setCurrentGuess("")
    setKeyboardStates({})
    setStatusMessage("")
    setShowInvalid(false)
    setGameStatus("playing")
    setSolution(pickRandomWord())
  }

  const statusClasses = [
    "status-message",
    gameStatus !== "playing" ? "final" : "",
    gameStatus === "lost" ? "lost" : "",
  ].filter(Boolean).join(" ")

  return (
    <div className="app">
      <h1 className="title">Hádej slovo</h1>
      <GameDisplay
        guesses={guesses}
        currentGuess={currentGuess}
        showInvalid={showInvalid}
        maxGuesses={MAX_GUESSES}
        wordLength={WORD_LENGTH}
      />
      {statusMessage && (
        <div className={statusClasses}>
          {statusMessage}
        </div>
      )}
      <div className="keyboard">
        {KEYBOARD_LAYOUT.map((row, rowIndex) => (
          <div className="keyboard-row" key={`keyboard-row-${rowIndex}`}>
            {row.map(keyValue => {
              const isControlKey = keyValue === "ENTER" || keyValue === "BACK"
              const lookupKey = keyValue.length === 1 ? keyValue : keyValue === "BACK" ? "" : keyValue
              const letterState = lookupKey && keyboardStates[lookupKey]
              const stateClass = letterState ? ` ${letterState}` : ""
              const buttonLabel = keyValue === "BACK" ? "DEL" : keyValue
              return (
                <button
                  key={keyValue}
                  type="button"
                  className={`key-button${isControlKey ? " wide" : ""}${stateClass}`}
                  onClick={() => handleKeyPress(isControlKey ? keyValue : keyValue)}
                  disabled={gameStatus !== "playing"}
                >
                  {buttonLabel}
                </button>
              )
            })}
          </div>
        ))}
      </div>
      {gameStatus !== "playing" && (
        <button type="button" className="reset-button" onClick={resetGame}>
          Hrát znovu
        </button>
      )}
    </div>
  )
}

export default App
