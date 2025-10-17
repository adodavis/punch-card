import { useContext, createContext, useState } from 'react'

const DataContext = createContext();

export const useData = () => {
    return useContext(DataContext);
}

export const DataProvider = ({ children }) => {
    const [fightData, setFightData] = useState({
        id: null,
        fighterA: "",
        fighterB: "",
        numRounds: 0,
        fighterATotalScore: 0,
        fighterBTotalScore: 0,
        roundScores: [],
        winner: "",
        outcome: "",
        winnerDisplay: ""
    })

    // Log changes whenever setFightData is called
    const logSetFightData = (newFightData) => {
        console.log('Updated fightData: ', newFightData);
        setFightData(newFightData);
    }

    return (
        <DataContext.Provider value={{ fightData, setFightData, logSetFightData }}>
            {children}
        </DataContext.Provider>
    )
}