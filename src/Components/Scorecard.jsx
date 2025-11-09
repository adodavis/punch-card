import { useData } from './DataContext'
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NoteIcon from './note-icon.svg'

const ScoreInput = ({ fighterName, score, onScoreChange, roundIndex }) => (
    <label>
        <select value={score} onChange={(e) => onScoreChange(roundIndex, fighterName, Number(e.target.value))}>
            <option value="">-</option>
            <option value="10">10</option>
            <option value="9">9</option>
            <option value="8">8</option>
            <option value="7">7</option>
            <option value="6">6</option>
        </select>
    </label>
)

const NoteButton = ({ onOpenNoteForm }) => (
    <button
        className="note-btn"
        onClick={onOpenNoteForm}
        onMouseEnter={((e) => (e.currentTarget.style.opacity = 1))}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.5)}
    >
        <img src={NoteIcon} alt="note-icon" style={{ width: '24px', height: '24px', fill: 'currentcolor'}} />
    </button>
)

const CloseRoundButton = ({ isClose, onToggleClose, roundIndex }) => (
    <button
        className="close-rd-btn"
        onClick={() => onToggleClose(roundIndex)}
        style={{backgroundColor: isClose ? 'red' : 'gray', color: 'white',
                opacity: isClose ? 0.8 : 0.1
        }}
    >
        {isClose ? 'Close': '-'}
    </button>
)

function Scorecard() {
    const { fightData, setFightData } = useData();
    const fighterA = fightData.fighterA;
    const fighterB = fightData.fighterB;
    const fighterATotalScore = fightData.fighterATotalScore ;
    const fighterBTotalScore = fightData.fighterBTotalScore;
    const roundScores = fightData.roundScores;
    const winner = fightData.winner;
    const outcome = fightData.outcome;
    const winnerDisplay = fightData.winnerDisplay;
    const [roundNotes, setRoundNotes] = useState([]);
    const [closeRounds, setCloseRounds] = useState([]);
    const [showNotePopup, setShowNotePopup] = useState(false);
    const [noteInputValue, setNoteInputValue] = useState('');
    const [currentRoundIndex, setCurrentRoundIndex] = useState('');
    const [showOutcomePopup, setShowOutcomePopup] = useState(false);
    const [showWinnerPopup, setShowWinnerPopup] = useState(false);
    const navigate = useNavigate();

    const isPreviousRoundScored = (roundIndex) => {
        if (roundIndex === 0) {
            return true;
        }
        else {
            return roundScores[roundIndex - 1].fighterA > 0 && roundScores[roundIndex - 1].fighterB > 0;
        }
    }

    const handleScoreChange = (roundIndex, fighter, score) => {
        const updatedScores = [...roundScores];

        if (fighter === fighterA) {
            updatedScores[roundIndex] = {...updatedScores[roundIndex], fighterA: score};
        }
        else if (fighter === fighterB) {
            updatedScores[roundIndex] = {...updatedScores[roundIndex], fighterB: score};
        }

        // Updates fightData with new round scores, clears outcome and winnerDisplay
        setFightData(prevFightData => ({
            ...prevFightData,
            roundScores: updatedScores,
            outcome: "",
            winner: "",
            winnerDisplay: ""
        }))
    }

    const handleOpenNoteForm = (roundIndex) => {
        setCurrentRoundIndex(roundIndex)
        setNoteInputValue(roundNotes[roundIndex]);
        setShowNotePopup(true);
    }

    const handleNoteChange = (e) => {
        setNoteInputValue(e.target.value);
    }

    const handleSaveNote = () => {
        const updatedNotes = [...roundNotes];
        updatedNotes[currentRoundIndex] = noteInputValue;
        setRoundNotes(updatedNotes);
        setShowNotePopup(false);
    }

    const handleToggleClose = (roundIndex) => {
        const updatedCloseRounds = [...closeRounds];
        updatedCloseRounds[roundIndex] = !updatedCloseRounds[roundIndex];
        setCloseRounds(updatedCloseRounds);
    }

    const handleOutcomeChange = (newOutcome) => {
        setFightData(prev => ({
            ...prev,
            outcome: newOutcome
        }))

        let winnerText = "";

        // If a winner is already selected, update the winnerDisplay with the new winner
        if (newOutcome !== outcome && outcome !== "") {
            winnerText = winner === fighterA
                ? `${fighterA} ${outcome} ${fighterB}`
                : `${fighterB} ${outcome} ${fighterA}`;
        }

        if (newOutcome === "NC") {
            winnerText = "No Contest";
        }

        setFightData(prevFightData => ({
            ...prevFightData,
            winnerDisplay: winnerText
        }))

        // Show the winner selection if it's a fight-ending outcome with a winner
        if (["KO", "TKO", "RTD", "TD", "DQ"].includes(newOutcome)) {
            setShowWinnerPopup(true);
        }
        else {
            setShowWinnerPopup(false);
        }
    }

    const handleWinnerChange = (selectedWinner) => {
        const winnerText = selectedWinner === fighterA
            ? `${fighterA} ${outcome} ${fighterB}`
            : `${fighterB} ${outcome} ${fighterA}`;
        
        if (winnerText !== winnerDisplay) {
            setFightData(prevFightData => ({
                ...prevFightData,
                winner: selectedWinner,
                winnerDisplay: winnerText
            }))
        }

        setShowOutcomePopup(false);
        setShowWinnerPopup(false);
    }

    // Updates fightData with the latest total scores whenever round scores change
    useEffect(() => {
        if (roundScores.length > 0) {
            const totalScoreA = roundScores.reduce((acc, round) => acc + round.fighterA, 0);
            const totalScoreB = roundScores.reduce((acc, round) => acc + round.fighterB, 0);

            setFightData(prevFightData => ({
                ...prevFightData,
                fighterATotalScore: totalScoreA,
                fighterBTotalScore: totalScoreB
            }))
        }
    },[roundScores], setFightData)

    // Saves fight data to local storage whenever round scores change
    useEffect(() => {
        if (!fightData || !fightData.id || fightData.numRounds === 0)
            return;

        // Prevent saving empty rounds on first mount
        if (fightData.roundScores.length === 0)
            return;

        localStorage.setItem(`fight-${fightData.id}`, JSON.stringify(fightData));
    }, [roundScores, winner, outcome]);

    // Saves roundNotes and close rounds when either changes
    useEffect(() => {
        if (!fightData?.id)
            return;

        if (roundNotes.length > 0) {
            localStorage.setItem(`fight-${fightData.id}-roundNotes`, JSON.stringify(roundNotes));
        }

        if (closeRounds.length > 0) {
            localStorage.setItem(`fight-${fightData.id}-closeRounds`, JSON.stringify(closeRounds));
        }
    }, [roundNotes, closeRounds]);

    // Loads fight data from local storage when the component mounts
    useEffect(() => {
        const id = fightData.id || localStorage.getItem('activeFightId');

        if (!id)
            return;

        const savedFightData = localStorage.getItem(`fight-${id}`);

        if (savedFightData) {
            setFightData(JSON.parse(savedFightData));
        }

        const savedRoundNotes = localStorage.getItem(`fight-${fightData.id}-roundNotes`);
        const savedCloseRounds = localStorage.getItem(`fight-${fightData.id}-closeRounds`);

        if (savedRoundNotes) {
            setRoundNotes(JSON.parse(savedRoundNotes));
        }

        if (savedCloseRounds) {
            setCloseRounds(JSON.parse(savedCloseRounds));
        }
    }, [])

    // Ensure rounds always have a valid structure after loading
    useEffect(() => {
        if (!fightData?.numRounds)
            return;

        if (!fightData.roundScores || fightData.roundScores.length  === 0) {
            const initialRoundScores = Array.from( {length: parseInt(fightData.numRounds, 10)}, () => ({ fighterA: 0, fighterB: 0}));

            setFightData(prevFightData => ({
            ...prevFightData,
            roundScores: initialRoundScores
        }))
        }
    }, [fightData.numRounds])

    // Return to list of scorecards
    const handleNavigate = () => {
        navigate(-1);
    }

    if (!fightData || fightData.numRounds === null || fightData.numRounds === undefined) {
        return <p>Loading fight data...</p>
    }

    return (
        <div className="scorecard-page-container">
            <div className="fighters-names-container">
                <h2>{fighterA} vs. {fighterB}</h2>
            </div>

            {roundScores.length > 0 && roundScores.map((score, index) => (
                <div key ={index}>
                    {/*Displays round scoring selection only after previous rounds scored */}
                    {isPreviousRoundScored(index) && (
                        <div className="score-input-container">
                            <div className="score-input-row">
                                <ScoreInput
                                    fighterName={fighterA}
                                    score={score.fighterA}
                                    roundIndex={index}
                                    onScoreChange={handleScoreChange}
                                    className="score-input"
                                />

                                <label className="rd-label">Round {index + 1}</label>

                                <ScoreInput
                                    fighterName={fighterB}
                                    score={score.fighterB}
                                    roundIndex={index}
                                    onScoreChange={handleScoreChange}
                                    className="score-input"
                                />
                            </div>

                            <div className="btn-container">
                                <NoteButton onOpenNoteForm={() => handleOpenNoteForm(index)}/>

                                <CloseRoundButton
                                    isClose={closeRounds[index]}
                                    onToggleClose={handleToggleClose}
                                    roundIndex={index}
                                />
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/*Displays information on how the fight ended */}
            {winnerDisplay && (
                <div className="winner-container">
                    {winnerDisplay}
                </div>
            )}

            {/*Displays total scores after round 1 is scored for both fighters */}
            {fighterATotalScore > 0 && fighterBTotalScore > 0 && (
                <div className="total-scores-container">
                    <label>{fighterATotalScore}-{fighterBTotalScore}</label>
                </div>
            )}

            <div className="back-btn">
                <button onClick={handleNavigate}>&lt; Back</button>
            </div>

            <div className="end-fight-btn">
                <button onClick={() => setShowOutcomePopup(true)}>End Fight</button>
            </div>

            {/* Displays text area to enter notes when notes button is clicked */}
            {showNotePopup  && (
                <div className="notes-popup">
                    <h2>Round {currentRoundIndex + 1} Notes</h2>
                    <textarea
                     value={noteInputValue}
                     onChange={handleNoteChange}
                     placeholder="Enter your note here."
                    />
                    <br />
                    <button onClick={handleSaveNote}>Save</button>
                    <button onClick={() => setShowNotePopup(false)}>Close</button>
                </div>
            )}

            {/* Displays selection for fight ending method when 'End Fight' button is clicked */}
            {showOutcomePopup && (
                <div className="outcome-popup">
                    <h2>Select Fight Outcome</h2>
                    <select onChange={(e) => handleOutcomeChange(e.target.value)}>
                        <option value="">How did the fight end?</option>
                        <option value="KO">KO</option>
                        <option value="TKO">TKO</option>
                        <option value="RTD">Referee Technical Decision</option>
                        <option value="TD">Tecnical Decision</option>
                        <option value="DQ">Disqualification</option>
                        <option value="NC">No Contest</option>
                    </select>

                    <button onClick={() => setShowOutcomePopup(false)}>Close</button>
                </div>
            )}

            {/*Displays winner selection after outcome is selected */}
            {showWinnerPopup && (
                <div className="winner-popup">
                    <h2>Who Won?</h2>

                    <select value={winner} onChange={(e) => handleWinnerChange(e.target.value)}>
                        <option value="">Select a winner</option>
                        <option value={fighterA}>{fighterA}</option>
                        <option value={fighterB}>{fighterB}</option>
                    </select>

                    <button onClick={() => setShowWinnerPopup(false)}>Close</button>
                </div>
            )}
        </div>
    )
}

export default Scorecard