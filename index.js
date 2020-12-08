

// Node Modules
const HCL = require("js-hcl-parser");
const csv = require('csv-parser')
const fs = require('fs');
const util = require('util');


// Constants
const pathToStates = process.argv[2];
const pathToRules = "./rules/"
const MAX_CAPACITY = 3;
const MAX_LEVEL = 25;
const MIN_LEVEL = 1;
let passengersData = [];

// Promisifying fs methods, Reason : optimiztion of initiateLiftSystem() 
const readFile = util.promisify(fs.readFile);
const readdir = util.promisify(fs.readdir);


// Things Lift Admin can see at any time and set them
let Instructions = {}// This shoudnt be needed, we can remove it by refactoring code
let rules = {}
let prevDoorOpen = {}

// Destination folder name : To decide withrespect to rules used
let FolderName = "WithOutRules";



// // 
// A1

// let Parent 

// C45
// P['ID'] = ID, OWN,DESTINATION
// P1

// OP-1

// PC-
async function initiateRulesEngine(rules) {
    //names = await fs.readdir("path/to/dir");
    let Promises = []
    let filenames = await readdir(pathToRules);
    filenames.forEach((filename) => {
        Promises.push(new Promise((resolve, reject) => {
            readFile(pathToRules + filename, 'utf-8').then((rule, error) => {

                let json = JSON.parse(rule);
                if (json.isRuleActive) {
                    if (FolderName.length + json.ruleName.length < 255) {
                        if (FolderName == "WithOutRules") FolderName = "With";
                        FolderName = FolderName + json.ruleName;
                    }
                    rules[json.ruleName] = json.rule;
                }

                resolve();
            })
        }))
    })
    await Promise.all(Promises)
}



// To get all data ready so we dont process it again and again
async function initiateLiftSystem(states, passengersData) {

    //names = await fs.readdir("path/to/dir");
    let Promises = []

    let filenames = await readdir(pathToStates);
    filenames.forEach((filename) => {
        Promises.push(new Promise((resolve, reject) => {
            readFile(pathToStates + "/" + filename, 'utf-8').then((state, error) => {
                states[filename.slice(0, -4)] = HCL.parse(state);
                resolve();
            })
        }))
    })

    Promises.push(new Promise((resolve, reject) => {
        fs.createReadStream('passengers.csv')
            .pipe(csv({ separator: '\t' }))
            .on('data', (data) => {

                passengersData[data['id']] = {
                    'health': data['health'],
                    'age': parseInt(data['age']),
                    'familyId': parseInt(data['family_id']),
                }
                resolve();
            })
    }))

    await Promise.all(Promises)
}


function disabledFilter(passenger_id) {

    if (rules['ProrityToDisabled'] != undefined && passengersData[passenger_id].health == rules['ProrityToDisabled']["disablePersonIdentifier"]) {
        return true;
    }
    else {
        return false;
    }
}

function safeChildernFilter(passenger_id) {
    //console.log(passenger_id)
    if (rules['SafeChildern'] != undefined && passengersData[passenger_id]["age"] <= rules['SafeChildern']["minAge"]) {
        return true;
    }
    else {
        return false;
    }
}

function createlevelDS(p, d, levelwise_situation, passenger_id) {

    let disablefilter = disabledFilter(passenger_id)

    // if (disablefilter) console.log(disablefilter, passenger_id)
    if (levelwise_situation[p] === undefined) {
        levelwise_situation[p] = { "up": {}, "down": {}, "disabledUp": {}, "disabledDown": {} };
    }
    if (d > p) {

        if (disablefilter) {
            if (levelwise_situation[p]["disabledUp"][d] === undefined) levelwise_situation[p]["disabledUp"][d] = [];
            levelwise_situation[p]["disabledUp"][d].push(passenger_id);
        }
        else {
            if (levelwise_situation[p]["up"][d] === undefined) levelwise_situation[p]["up"][d] = [];
            levelwise_situation[p]["up"][d].push(passenger_id);
        }

    }
    else {
        if (disablefilter) {
            if (levelwise_situation[p]["disabledDown"][d] === undefined) levelwise_situation[p]["disabledDown"][d] = [];
            levelwise_situation[p]["disabledDown"][d].push(passenger_id);
        }
        else {
            if (levelwise_situation[p]["down"][d] === undefined) levelwise_situation[p]["down"][d] = [];
            levelwise_situation[p]["down"][d].push(passenger_id);
        }
    }
}

// This function, can be extended if we want to assign level wise Priority as well 
// Disabled Persons at First in queue
function SortbyPriorityToDisabledPeople(levelwise_situation) {

    // console.log('\nSortingHappening')
    for (level in levelwise_situation) {

        for (destination in levelwise_situation[level]['disabledDown']) {

            if (levelwise_situation[level]['down'][destination] === undefined) levelwise_situation[level]['down'][destination] = [];
            levelwise_situation[level]['down'][destination] = levelwise_situation[level]['disabledDown'][destination].concat(levelwise_situation[level]['down'][destination]);

            // console.log(levelwise_situation[level]['down'][destination]);
        }
        for (destination in levelwise_situation[level]['disabledUp']) {
            if (levelwise_situation[level]['up'][destination] === undefined) levelwise_situation[level]['up'][destination] = [];
            levelwise_situation[level]['up'][destination] = levelwise_situation[level]['disabledUp'][destination].concat(levelwise_situation[level]['up'][destination]);

            // console.log(levelwise_situation[level]['up'][destination]);
        }
    }



}
function groupPassengers(state, levelwise_situation) {

    state.forEach((job) => {
        let d = job["goto_level"];
        let p = job["at_level"];
        createlevelDS(p, d, levelwise_situation, job["id"]);
    }
    )
}


function createLiftDS(lift, lifts_pos) {
    lifts_pos[lift['id']] = lift['at_level'];
}

Object.size = function (obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};
// uper ke up, niche ke down
function decideDirectionOfLift(lift_id, levelwise_situation, lifts_pos) {

    let straightUp = 0;
    let straightDown = 0;

    let upThenDown = 0;
    let downThenUp = 0;


    // Sorry Zan, Here this tight coupling of disabled people shouuld have beeen avoided, but this time limit is not allowing me too
    let disabledPeopleStraightUp = 0;
    let disabledPeopleStraightDown = 0;

    let disabledPeopleUpThenDown = 0;
    let disabledPeopleDownThenUp = 0;

    for (let level in levelwise_situation) {
        //console.log(level);
        if (levelwise_situation.hasOwnProperty(level)) {


            if (level == lifts_pos[lift_id]) {
                straightDown += Object.size(levelwise_situation[level].down)
                straightUp += Object.size(levelwise_situation[level].up)

                disabledPeopleStraightDown += Object.size(levelwise_situation[level].disabledDown)
                disabledPeopleStraightUp += Object.size(levelwise_situation[level].disabledUp)
            }
            else if (level < lifts_pos[lift_id]) {
                straightDown += Object.size(levelwise_situation[level].down)
                downThenUp += Object.size(levelwise_situation[level].up)

                disabledPeopleStraightDown += Object.size(levelwise_situation[level].disabledDown)
                disabledPeopleDownThenUp += Object.size(levelwise_situation[level].disabledUp)
            }
            else if (level > lifts_pos[lift_id]) {
                straightUp += Object.size(levelwise_situation[level].up)
                upThenDown += Object.size(levelwise_situation[level].down)


                disabledPeopleStraightUp += Object.size(levelwise_situation[level].disabledUp)
                disabledPeopleUpThenDown += Object.size(levelwise_situation[level].disabledDown)
            }
        }
    }

    // //This can also be wrote clean
    // console.log(straightUp, straightDown, straight)


    //console.log(straightUp, straightDown, upThenDown, downThenUp);
    if (straightUp == 0 && straightDown == 0 && upThenDown == 0 && downThenUp == 0) return 'idle'
    if (disabledPeopleStraightUp > disabledPeopleStraightDown) return 'up';
    else if (disabledPeopleStraightUp != disabledPeopleStraightDown) return 'down';
    else if (disabledPeopleUpThenDown > disabledPeopleUpThenDown) return 'updown';
    else if (disabledPeopleUpThenDown != disabledPeopleUpThenDown) return 'downup';
    else if (straightUp > straightDown) return 'up';
    else if (straightUp != straightDown) return 'down';
    else if (upThenDown > downThenUp) return 'updown';
    else return 'downup';
}

let goSolo = {};
function decisionForChildern(passenger_id, movement, destination) {

    // console.log('\nmovement-----', movement);
    let parentfound = false;
    movement[destination].forEach((passengerInsideLift) => {
        if (passengersData[passenger_id].familyId == passengersData[passengerInsideLift].familyId) {
            parentfound = true;
        }
    })
    if (parentfound) {
        return "Safe"
    }
    if (Object.size(movement) == 1) {
        requiredPeople = 0;

        // console.log("goSolo");
        return "goSolo";
    }

    return "wait";

}
// let x = levelwise_situation[lift_pos[lift_id]].direction;
function stopForEntry(levelwise_situation, pos, direction, requiredPeople, load, movement, lift_id, lift_pos) {


    //no stop as no waiting here
    if (levelwise_situation[pos] === undefined || levelwise_situation[pos][direction] === undefined || Object.size(levelwise_situation[pos][direction]) == 0) return load;

    let x = levelwise_situation[pos][direction];
    let temp = 0;
    let toBeDeletedLevels = [];
    // console.log("\nBefore", x);
    // console.log("\n Movement", movement);
    // console.log("--------------------------------")
    lift_pos[lift_id] = pos;
    if (prevDoorOpen[lift_id] != pos) Instructions[lift_id].push('STOP ' + pos)
    prevDoorOpen[lift_id] = pos;
    //console.log(x);
    for (destination in x) {
        x[destination].some((passenger) => {
            if (movement[destination] === undefined) movement[destination] = [];
            //console.log(passenger);
            let decision = "NA"

            // console.log(safeChildernFilter(passenger), passengersData[passenger]["age"]);
            if (safeChildernFilter(passenger)) {
                decision = decisionForChildern(passenger, movement, destination);
            }

            if (decision == 'wait') {

            }
            else if (decision == 'goSolo') {

                // console.log('gosolo');
                movement[destination].push(passenger)
                Instructions[lift_id].push("PASSENGER " + passenger + " ENTER")
                requiredPeople = 0;
                goSolo[passenger] = true;
                temp++;
                load = MAX_CAPACITY;
                if (requiredPeople == 0) return true;
            }
            else { // FOR PARENT FOUND OR NA CASE


                movement[destination].push(passenger)
                Instructions[lift_id].push("PASSENGER " + passenger + " ENTER")
                requiredPeople--;
                temp++;
                load++;
                if (requiredPeople == 0) return true;
            }


        })
        x[destination].splice(0, temp);
        if (x[destination].length == 0) toBeDeletedLevels.push(destination);
        temp = 0;
        if (requiredPeople == 0) break;
    }


    toBeDeletedLevels.forEach((level) => {
        delete x[level];
    })
    // console.log("\nAfter", x);
    levelwise_situation[pos][direction] = x;
    return load;
}

function stopForExit(lift_id, movement, i, lifts_pos) {

    let flag = false;

    // To check if lift is not already there
    if (prevDoorOpen[lift_id] != i) Instructions[lift_id].push('STOP ' + i)
    prevDoorOpen[lift_id] = i;
    movement[i].forEach((passenger) => {
        Instructions[lift_id].push("PASSENGER " + passenger + " LEAVE");

        // Childern Go Solo Case
        if (goSolo[passenger] == true) {
            // console.log("sadsaasas---------------------------------------------");
            flag = true;
            goSolo[passenger] = false;
        }
    })


    let freed_load = movement[i].length
    delete movement[i];


    if (flag) {
        freed_load = MAX_CAPACITY;
    }
    return freed_load;
}

let test = 1;



function moveliftSingular(levelwise_situation, lift_id, lifts_pos, movement, dir, load) {
    // up dir
    // console.log(dir);
    let start_point = lifts_pos[lift_id];
    if (dir == 'up') {
        Instructions[lift_id].push('GO ' + 'UP');
        for (let i = start_point; i <= MAX_LEVEL; i++) {

            if (movement.hasOwnProperty(i)) {

                lifts_pos[lift_id] = i;
                load = load - stopForExit(lift_id, movement, i, lifts_pos);

            }
            if (load < MAX_CAPACITY) {
                // lifts_pos[lift_id] = i;
                load = stopForEntry(levelwise_situation, i, "up", MAX_CAPACITY - load, load, movement, lift_id, lifts_pos)
            }
        }



    }

    if (dir == 'updown') {
        Instructions[lift_id].push('GO ' + 'UP');
        for (let i = start_point; i <= MAX_LEVEL; i++) {

            if (movement.hasOwnProperty(i)) {

                lifts_pos[lift_id] = i;
                load = load - stopForExit(lift_id, movement, i, lifts_pos);

            }
            if (load < MAX_CAPACITY) {
                // lifts_pos[lift_id] = i;
                load = stopForEntry(levelwise_situation, i, "down", MAX_CAPACITY - load, load, movement, lift_id, lifts_pos)
            }
        }



    }
    //down dir
    if (dir == 'down') {

        Instructions[lift_id].push('GO ' + 'DOWN');
        for (let i = start_point; i >= MIN_LEVEL; i--) {


            if (movement.hasOwnProperty(i)) {
                lifts_pos[lift_id] = i;
                load = load - stopForExit(lift_id, movement, i, lifts_pos);

            }
            if (load < MAX_CAPACITY) {
                // lifts_pos[lift_id] = i;
                load = stopForEntry(levelwise_situation, i, "down", MAX_CAPACITY - load, load, movement, lift_id, lifts_pos)
            }
        }
    }

    if (dir == 'downup') {

        Instructions[lift_id].push('GO ' + 'DOWN');
        for (let i = start_point; i >= MIN_LEVEL; i--) {


            if (movement.hasOwnProperty(i)) {
                lifts_pos[lift_id] = i;
                load = load - stopForExit(lift_id, movement, i, lifts_pos);

            }
            if (load < MAX_CAPACITY) {
                // lifts_pos[lift_id] = i;
                load = stopForEntry(levelwise_situation, i, "up", MAX_CAPACITY - load, load, movement, lift_id, lifts_pos)
            }
        }
    }
}
function movelift(levelwise_situation, lift_id, lifts_pos, movement, dir, load, Intent) {

    if (dir == 'up') {
        moveliftSingular(levelwise_situation, lift_id, lifts_pos, movement, dir, load)
        Intent[lift_id] === undefined ? Intent[lift_id] = [] : Intent[lift_id] = 'down';
    }
    if (dir == 'updown') {
        moveliftSingular(levelwise_situation, lift_id, lifts_pos, movement, 'updown', load)
        moveliftSingular(levelwise_situation, lift_id, lifts_pos, movement, 'down', load)
        Intent[lift_id] === undefined ? Intent[lift_id] = [] : Intent[lift_id] = 'down';
    }

    if (dir == 'down') {
        moveliftSingular(levelwise_situation, lift_id, lifts_pos, movement, dir, load)
        Intent[lift_id] === undefined ? Intent[lift_id] = [] : Intent[lift_id] = 'down';
    }
    if (dir == 'downup') {
        moveliftSingular(levelwise_situation, lift_id, lifts_pos, movement, 'downup', load)
        moveliftSingular(levelwise_situation, lift_id, lifts_pos, movement, 'up', load)
        Intent[lift_id] === undefined ? Intent[lift_id] = [] : Intent[lift_id] = 'up';
    }
    // console.log(lifts_pos);
    startLift(delegateWork(lift_id, lifts_pos), lifts_pos, levelwise_situation, Intent);
    // if (test < 10) {
    //     test++;
    //     startLift(1, lifts_pos, levelwise_situation);
    // }
}

function delegateWork(prev_one, lifts_pos) {

    let t = (prev_one + 1) % (Object.size(lifts_pos) + 1);

    if (t == 0) {
        return 1;
    }
    else {
        return t;
    }

}


function startLift(id, lifts_pos, levelwise_situation, Intent) {
    let movement = {}
    let dir = decideDirectionOfLift(id, levelwise_situation, lifts_pos);
    Intent[id] = dir;
    // console.log(dir);
    // console.log(JSON.stringify(levelwise_situation));
    //Get Passengers of Initial Level
    if (dir == 'idle') {

    }
    else {
        if (Instructions[id] === undefined) Instructions[id] = [];
        let load = stopForEntry(levelwise_situation, lifts_pos[id], dir, MAX_CAPACITY, 0, movement, id, lifts_pos)
        movelift(levelwise_situation, id, lifts_pos, movement, dir, load, Intent)
    }
}

function scheduleJobs(state) {

    let levelwise_situation = {}
    let lifts_pos = {}
    let Intent = {}

    //grouping - to add childern clasue here
    groupPassengers(state['passenger'], levelwise_situation);
    // console.log("--------------------------------------------------")
    // console.log(levelwise_situation);

    // sorting : Giving Priority to Disabled people
    if (rules['ProrityToDisabled'] !== undefined) SortbyPriorityToDisabledPeople(levelwise_situation);

    // console.log(JSON.stringify(levelwise_situation));
    // create lift ds
    state['lift'].forEach((lift) => createLiftDS(lift, lifts_pos))
    startLift(delegateWork(0, lifts_pos), lifts_pos, levelwise_situation, Intent);
    for (lift_id in lifts_pos) {
        if (Instructions[lift_id] === undefined) Instructions[lift_id] = [];
        // console.log(Intent);
        if (Intent[lift_id] == "up" || Intent[lift_id] == "idle") {
            Instructions[lift_id].push('GO DOWN')
        }
        Instructions[lift_id].push('STOP 1')

    }
}


function goToGround(lift_id) {

    console.log(lift_id);

    //if (Intent[lift_id] == 'UP') 
    Instructions[lift_id].push('GO DOWN')
    Instructions[lift_id].push('STOP 1')
}
function output() {
    for (lift_id in Instructions) {
        Instructions[lift_id].forEach((Instruction) => {
            console.log('\nLIFT ' + lift_id + ":" + " " + Instruction)
        })

        console.log('\n');
    }
}

function storeFiles(state_file) {
    var dir = './instructions/' + FolderName;
    if (!fs.existsSync(dir, { recursive: true })) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(`${dir}/${state_file}.json`, JSON.stringify(Instructions));

}
async function run() {


    let states = {};


    await initiateRulesEngine(rules);
    await initiateLiftSystem(states, passengersData);

    let i = 1;

    for (state_file in states) {


        scheduleJobs(JSON.parse(states[state_file]));
        output();
        storeFiles(state_file);
        Instructions = {};
        i++;


    }
    // states.forEach((state) => {


    // });


}
run();
// console.log(process.argv)
