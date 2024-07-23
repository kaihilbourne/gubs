import { getDatabase, ref, set, get, child } from 'firebase/database';
import { useState } from 'react';
// import { Navigate } from 'react-router-dom';

export function createRoom(uname,gameroom){
    const db = getDatabase();
    const refe = ref(db,"rooms/"+gameroom);
    get(child(refe, '/unames')).then((snapshot) => {
        if (snapshot.exists()) {
            let temp = snapshot.val();
            temp[temp.length] = uname;
            set(refe, {
                unames: temp,
                started: false
            });
            alert(snapshot.val());
        } else {
            set(refe, {
                    unames: [uname],
                    started: false
                });
        }
    }).catch((error) => {
        console.error(error);
    });
    
}

export function useGetPlayers(){
    const [isLoading,setLoading] = useState(false);

    async function getPlayers(gameroom){
        setLoading(true);

        const db = getDatabase();
        const refe = ref(db,"numrooms/"+gameroom+"/unamesnum");

        await get(refe).then((snapshot) => {
            return snapshot.val();
        });

        setLoading(false);
    }

    return {getPlayers, isLoading};
}

export function useCreateNumberRoom(){
    const [isLoading, setLoading] = useState(false);

    async function createNumRoom(uname,gameroom){
        setLoading(true);
        const db = getDatabase();
        const refe = ref(db,"numrooms/"+gameroom);
        let v = false;
        await get(child(refe, '/unamesnum')).then((snapshot) => {
            if (snapshot.exists()) {
                let temp = snapshot.val();
                v = true;
                for(let i = 0; i < temp.length; i++){
                    // alert(temp[i]);
                    if(temp[i].uname == uname){
                        alert("Username already chosen");
                        setLoading(false);
                        v = false;
                    }
                }
                if(v){
                    temp[temp.length] = {uname:uname, num:0};
                    set(refe, {
                        unamesnum: temp,
                        started: false
                    });
                    alert("getting through the cool way");
                }
                
            } else {
                v = true;
                set(refe, {
                        unamesnum: [{uname:uname, num:0}],
                        started: false
                    });
                alert("getting through");
            }
        }).catch((error) => {
            console.error(error);
        });
        setLoading(false);
        return v;
    }

    return {createNumRoom,isLoading};
    
}