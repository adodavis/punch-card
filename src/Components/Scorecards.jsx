import { useState, useEffect } from 'react'
import { useData } from './DataContext'
import { useNavigate } from 'react-router-dom';
import ChampionshipIcon from './championship-icon.png'
import SearchIcon from './search-icon.svg'
import ImportExportIcon from './import-export-icon.svg'

const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1);
    const day = String(today.getDate());

    return `${year}-${month}-${day}`;
}

const ChampionshipDislay = ({ isChampionshp }) => {
    if (isChampionshp === true) {
        return (
            <span>
                <img src={ChampionshipIcon} alt ="championship-icon" className="championship-icon" />
            </span>
        )
    }
}

const ResultDisplay = ( {fighterA, fighterB, totalScoreA, totalScoreB, outcome, roundScores, numRounds, winner }) => {
    // Check if all rounds have been scored (fight went the full distance)
    const allRoundsScored = roundScores.length === parseInt(numRounds, 10) &&
        roundScores.every(round => round.fighterA !== 0 && round.fighterB !== 0);
        let splitName = "";

    if (["KO", "TKO", "RTD", "TD"].includes(outcome)) {
        if (winner === fighterA) {
            splitName = fighterA.split(" ");
        }
        else if (winner === fighterB) {
            splitName = fighterB.split(" ");
        }

        const lastName = splitName[1];

        return (
            <div>
                <p>{lastName} {outcome} {(roundScores.filter(round => round.fighterA > 0 && round.fighterB > 0)).length + 1}</p>
            </div>
        )
    }
    else if (allRoundsScored) {
        return (
            <div>
                <p>Your Score: {`${totalScoreA}-${totalScoreB}`}</p>
            </div>
        )
    }
    else if (outcome === "NC") {
        return (
            <div>
                <p>No Contest</p>
            </div>
        )
    }
}

function Scorecards() {
    const [showAddFightForm, setShowAddFightForm] = useState('');
    const [showAddFightButton, setShowAddFightButton] = useState(true);
    const [fighterA, setFighterA] = useState('');
    const [fighterB, setFighterB] = useState('');
    const [numRounds, setNumRounds] = useState(0);
    const [fightDate, setFightDate] = useState(getCurrentDate());
    const [isChampionshp, setIsChampionship] = useState('');
    const { fightData, setFightData } = useData();
    const [scorecards, setScorecards] = useState([]);
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showImportExportPopup, setShowImportExportPopup] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const navigate = useNavigate();

    const toggleAddFightForm = () => {
        setShowAddFightForm(prev => !prev);
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!fighterA || !fighterB || numRounds === 0 || fightDate === "" || isChampionshp === "") {
            alert('Please enter all fields');
            return;
        }

        const trimmedA = fighterA.trim();
        const trimmedB = fighterB.trim();

        if (trimmedA.length < 4 || trimmedB.length < 4) {
            alert('Fighters\' names must be at least 4 letters');
            return;
        }

        setShowAddFightForm(false);

        const id = Date.now().toString();   // Genrates a unique fight ID
        const initialRoundScores = Array.from( {length: numRounds }, () => ({ fighterA: 0, fighterB: 0 })); // Sets all round scores to zero for both fighters

        // Set fightData with user input and default values
        const newFight = {
            id,
            fighterA,
            fighterB,
            numRounds,
            fightDate,
            isChampionshp,
            fighterATotalScore: 0,
            fighterBTotalScore: 0,
            roundScores: initialRoundScores,
            winner: "",
            outcome: "",
            winnerDisplay: ""
        }
        setFightData(newFight);

        // Saves fightData to local storage
        localStorage.setItem(`fight-${id}`, JSON.stringify(newFight));

        // Update the list of all scorecards
        setScorecards(prevScorecards => [...prevScorecards, newFight]);

        // Clears user input
        setFighterA('');
        setFighterB('');
        setNumRounds(0);
        setFightDate(getCurrentDate());
        setIsChampionship('');
    }

    // Navigates to selected scorecard
    const scorecardView = (selectedCard) => {
        const savedFight = localStorage.getItem(`fight-${selectedCard.id}`);
        setFightData(savedFight ? JSON.parse(savedFight) : selectedCard);
        localStorage.setItem('activeFightId', selectedCard.id);
        navigate('/scorecard');
    }

    const deleteScorecard = (id) => {
        const updatedScorecards = scorecards.filter(card => card.id !== id);
        setScorecards(updatedScorecards);
        localStorage.setItem('scorecards', JSON.stringify(updatedScorecards));
        localStorage.removeItem(`fight-${id}`); // Remove associated fight data
    }

    // Filter the scorecards based on search term 
    const filteredScorecards = scorecards.filter(card =>
        card.fighterA.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.fighterB.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Logic for exporting scorecards to a .JSON file
    const handleExport = () => {
        const data = JSON.stringify(scorecards, null, 2);
        const blob = new Blob([data], {type: 'application/json'});
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');   // Create a hidden <a> element
        link.href = url;
        link.download = 'scorecards.json';    // File name
        link.click();   // Trigger download

        window.URL.revokeObjectURL(url);    // Clean up URL object
    }

    // Accounts for changed variable name for number of rounds in previous app version
    const migrateScorecard = (card) => ({
        ...card,
        numRounds: card.numRound ?? card.rounds ?? 0,
        fightDate: card.fightDate ?? card.date ?? '',
    })

    // Allows user to select a file to import
    const triggerFileInput = () => {
        document.getElementById('file-input').click();
    }

    // Logic  for importing scorecards from a .JSON file
    const handleImport = (event) => {
        const file = event.target.files[0]; // Get the selected file
        
        if (file) {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result).map(migrateScorecard);
                    setScorecards((prevScorecards) => [...prevScorecards, ...(Array.isArray(importedData) ? importedData : [importedData])]);   // Update scorecards with appended data
                }
                catch (error) {
                    console.warn('Error parsing the imported file', error);
                }
            }

            reader.readAsText(file);
        }
    }

    // Saves scorecards to local storage only after data has been loaded once
     useEffect(() => {
        if (hasLoaded) {
            localStorage.setItem('scorecards', JSON.stringify(scorecards));
        }
    }, [scorecards, hasLoaded])

    // Restores scorecards and merges any saved fightData updates 
    useEffect(() => {
        const stored = localStorage.getItem('scorecards');

        if (stored) {
            try {
               setScorecards(JSON.parse(stored));
            }
            catch (err) {
                console.warn('Error parsing stored scorecards', err);
            }
        }
        setHasLoaded(true);
    }, [])

    // Syncs the current fightData changes back to the main scorecards array
    useEffect(() => {
        if (fightData.id) {
            setScorecards(prevScorecards => {
                const index = prevScorecards.findIndex(card => card.id === fightData.id);

                if (index !== -1) {
                    // Update the existing scorecard in the array
                    const updatedScorecards = [...prevScorecards];
                    updatedScorecards[index] = {
                        ...prevScorecards[index],
                        fighterATotalScore: fightData.fighterATotalScore,
                        fighterBTotalScore: fightData.fighterBTotalScore,
                        roundScores: fightData.roundScores,
                        winner: fightData.winner,
                        outcome: fightData.outcome,
                        winnerDisplay: fightData.winnerDisplay
                    }
                    return updatedScorecards;
                }
                else {
                    return prevScorecards;  // Return existing scorecard without changes if no matching fightData is found
                }
            })
        }
    }, [fightData])   

    return (
        <div className="scorecards-list">
            <div className="app-title-container">
                <h1>🥊Punch Card 🥊</h1>
            </div>

            {showAddFightButton && (
                <div className="add-fight-btn">
                    <button onClick={() => {
                        toggleAddFightForm();
                        setShowAddFightButton(false);
                    }}>
                        <span>+</span>
                    </button>
                </div>
            )}
            

            {/* Search section */}
            <div className="search-container">
                <button 
                    className="search-btn"
                    onClick={() => setShowSearchBar(!showSearchBar)}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
                >
                    <img src={SearchIcon} alt="search-icon" />
                </button>

                {/* Display the search bar when search icon is clicked */}
                {showSearchBar && (
                    <input
                        value={searchTerm}
                        className="search-input"
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search fighter by name"
                    />
                )}
            </div>

            {/* Display add fight form when '+' button is clicked */}
            {showAddFightForm && (
                <div className="add-fight-form">
                    <h2>Add New Fight</h2>

                    <div className="add-fight-form-cls-btn">
                        <button onClick={() => {
                            toggleAddFightForm();
                            setShowAddFightButton(true);
                        }}>X</button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <input
                            value={fighterA}
                            type="text"
                            onChange={(e) => setFighterA(e.target.value)}
                            placeholder="Fighter A"
                        />
                        <br />
                        <input
                            value={fighterB}
                            type="text"
                            onChange={(e) => setFighterB(e.target.value)}
                            placeholder="Fighter B"
                        />

                        <div className="add-fight-champ-container">
                            <select
                                value={isChampionshp}
                                onChange={(e) => {
                                    const val = e.target.value; setIsChampionship(val === "" ? "" : val === "true")
                                }}
                            >
                                <option value="">Championship Fight?</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                        </div>

                        <div className="add-fight-rds-container">
                            <select value={numRounds} onChange={(e) => setNumRounds(Number(e.target.value))}>
                                <option value="">Number of Rounds</option>
                                <option value="4">4</option>
                                <option value="6">6</option>
                                <option value="8">8</option>
                                <option value="10">10</option>
                                <option value="12">12</option>
                                <option value="15">15</option>
                            </select>
                        </div>

                        <div className="add-fight-date-container">
                            <input value={fightDate} type="date" onChange={(e) => setFightDate(e.target.value)} />
                        </div>

                        <div className="add-fight-form-submit-btn">
                            <button type="submit">Add Fight</button>
                        </div>
                    </form>
                </div>
            )}

            {filteredScorecards.length > 0 ? (
                filteredScorecards.map(card => (
                    <div key={card.id} className="scorecard-item">
                        <div className="scorecard-box-container" onClick={() => scorecardView(card)}>
                            <div className="card-names-container">
                                <p>{card.fighterA} vs. {card.fighterB}</p>
                                <ChampionshipDislay isChampionshp={card.isChampionshp} />
                            </div>

                            <div className="card-rds-container">
                                <p>{card.numRounds} Rounds</p>
                            </div>

                            <div className="card-date-container">
                                <p>{card.fightDate}</p>
                            </div>

                            {/* Display result if available */}
                            <div className="card-result-container">
                                <ResultDisplay
                                    fighterA={card.fighterA}
                                    fighterB={card.fighterB}
                                    totalScoreA={card.fighterATotalScore}
                                    totalScoreB={card.fighterBTotalScore}
                                    outcome={card.outcome}
                                    roundScores={card.roundScores}
                                    numRounds={card.numRounds}
                                    winner={card.winner}
                                />
                            </div>

                            <button 
                                className="delete-btn-container"
                                onClick={(e) => {
                                e.stopPropagation();
                                deleteScorecard(card.id);
                            }}
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <p>No scorecards available</p>
            )}

            {/* Import/Export Button - allows scorecards to be saved to a JSON file or loaded into local storage */}
            <button className="import-export-btn" onClick={() => setShowImportExportPopup(true)}>
                <img src={ImportExportIcon} alt="import-export" />
            </button>

            {showImportExportPopup && (
                <div className="import-export-popup">
                    <h2>Import/Export Scorecards</h2>

                    <button className="import-btn" onClick={triggerFileInput}>Import Scorecards</button>
                    <input 
                        id="file-input"
                        type="file"
                        accept=".json"
                        style={{ display: "none" }} // Hide the file input
                        onChange={handleImport}
                    />
                    <br />
                    <button className="export-btn" onClick={handleExport}>Export Scorecards</button>
                    <button className="import-export-cls-btn" onClick={() => setShowImportExportPopup(false)}>X</button>
                </div>
            )} 
        </div>
    )
}

export default Scorecards