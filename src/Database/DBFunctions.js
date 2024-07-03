import { getDatabase, ref, set, get, child } from 'firebase/database';
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

export async function createNumberRoom(uname,gameroom){
    alert("may i");
    const db = getDatabase();
    const refe = ref(db,"numrooms/"+gameroom);
    get(child(refe, '/unamesnum')).then((snapshot) => {
        if (snapshot.exists()) {
            let temp = snapshot.val();
            alert("anybody home");

            for(let i = 0; i < temp.length; i++){
                alert(temp[i]);
                if(temp[i] == uname){
                    alert("Username already chosen");
                    return false;
                }
            }
            temp[temp.length] = uname;
            set(refe, {
                unamesnum: temp,
                started: false
            });
        } else {
            alert("not found??");
            set(refe, {
                    unamesnum: [uname],
                    started: false
                });
        }
        return true;
    }).catch((error) => {
        console.error(error);
    });
    return true;
    
}