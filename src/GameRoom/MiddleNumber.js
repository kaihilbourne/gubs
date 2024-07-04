import { useParams, useNavigate } from "react-router-dom";
import "./MiddleNumber.css";
// import { useGetPlayers } from "../Database/DBFunctions";
import { getDatabase, ref, onValue, get, set, remove} from "firebase/database";
import { useState, useEffect } from "react";

export function MiddleNumber(){

    const [playerNames, setPlayerNames] = useState([]);
    const [loading, setLoading] = useState(true);
    const { roomID, uname } = useParams();
    const navigate = useNavigate();
    // const { getPlayers, isLoading } = useGetPlayers();

    async function gohome() {
        const db = getDatabase();
        const unameref = ref(db,"numrooms/"+roomID+"/unamesnum");
        await get(unameref).then((snapshot) => {
            if(snapshot.exists()){
                let temp = snapshot.val();
                for(let i = 0; i < temp.length; i++){
                    if(temp[i] == uname){
                        temp.splice(i,1);
                        break;
                    }
                }
                if(temp.length == 0){
                    const roomref = ref(db,"numrooms/"+roomID);
                    remove(roomref);
                } else{
                    set(unameref,temp);
                }
            }
        });
        navigate('/');
    }

    useEffect(() => {
        const db = getDatabase();
        const playerNamesRef = ref(db,"numrooms/"+roomID+"/unamesnum");


        const handleChange = (snapshot) => {
            const data = snapshot.val();
            if(data){
                setPlayerNames(data);
            }
            setLoading(false);
        }
        onValue(playerNamesRef,handleChange);

    }, [roomID]);

    

    const playerNamesDiv = playerNames.map(item => <p>{item}</p>);


    return(
        <div className="pagenumber">
            {roomID}
            <button onClick={gohome}>Go home</button>
            { loading
                ? <p>UHHHHHH</p>
                : playerNamesDiv
            }
        </div>
    );
}