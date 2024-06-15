import { useParams, useNavigate } from "react-router-dom";

export function GameRoom(){

    const { roomID } = useParams();
    const navigate = useNavigate();

    function gohome() {
        navigate('/');
    }


    return(
        <div>
            {roomID}
            <button onClick={gohome}>Go home</button>
        </div>
    );
}