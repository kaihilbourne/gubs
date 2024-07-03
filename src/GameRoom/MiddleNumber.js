import { useParams, useNavigate } from "react-router-dom";
import { createNumberRoom } from "../Database/DBFunctions.js";
import "./MiddleNumber.css";

export function MiddleNumber(){

    const { roomID, uname } = useParams();
    const navigate = useNavigate();

    function gohome() {
        navigate('/');
    }

    function update() {
        createNumberRoom(uname,roomID);
    }


    return(
        <div className="pagenumber">
            {roomID}
            <button onClick={gohome}>Go home</button>
            <button onClick={update}>Blehehe</button>
        </div>
    );
}