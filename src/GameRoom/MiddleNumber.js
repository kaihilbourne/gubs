import { useParams, useNavigate } from "react-router-dom";
import "./MiddleNumber.css";
// import { useGetPlayers } from "../Database/DBFunctions";
import { getDatabase, ref, onValue, get, set, remove} from "firebase/database";
import { useState, useEffect, useRef } from "react";

export function MiddleNumber(){
    const numRef = useRef(null);

    const [playerNames, setPlayerNames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ready, setReady] = useState(0);
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
                    if(temp[i].uname == uname){
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

    async function submitNumber(){
        const db = getDatabase();
        const reff = ref(db,"numrooms/"+roomID+"/unamesnum");

        
    }

    

    const playerNamesDiv = playerNames.map(item => <p>{item.uname} {item.num}</p>);


    return(
        <div className="pagenumber">
            <div className="subthing">
                <p className="headertext">The Middle Number Game</p>
                {roomID}
                <button onClick={gohome}>Go home</button>
                { loading
                    ? <p>UHHHHHH</p>
                    : playerNamesDiv
                }
            </div>
            <div className="subthing">
            <input 
                ref={numRef}
                type="number"
                placeholder="enter your number"
                pattern="[0-9]"
                id="num"
            />
            {
                ready == 0
                ? 
                <div>
                <button>
                    Submit your number
                </button>
                </div>
                :
                ready == 1
                ?
                <div>
                <button>
                    Take it back?
                </button>
                </div>
                :
                <div>
                <button>
                    Start again
                </button>
                </div>
            }
            
            </div>
        </div>
    );
}