import { useParams, useNavigate } from "react-router-dom";
import { createRoom } from "../Database/DBFunctions.js";

export function GameRoom(){

    const { roomID, uname } = useParams();
    const navigate = useNavigate();

    function gohome() {
        navigate('/');
    }

    function update() {
        createRoom(uname,roomID);
    }


    return(
        <div>
            {roomID}
            <button onClick={gohome}>Go home</button>
            <button onClick={update}>Blehehe</button>
        </div>
    );
}