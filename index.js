const HCL = require("js-hcl-parser");
const csv = require('csv-parser')
const fs = require('fs');
const util = require('util');
const { Engine } = require('json-rules-engine');
const { INSPECT_MAX_BYTES } = require("buffer");


const pathToStates = "./states"

const MAX_CAPACITY = 3;
const MAX_LEVEL = 25;
const MIN_LEVEL = 1;

let states = {};
let passengersData = [];
const readFile = util.promisify(fs.readFile);
const readdir = util.promisify(fs.readdir);

// function setupRules() {
//     let engine = new Engine()

let Instructions = {}
let Intent = {}
// let Childern = {

//     'id': {
//         mappedParent:
//             inpath :
//         parentStart:
//             parentDestination :
//     }

// }


// To get all data ready so we dont process it again and again
async function initiateLiftSystem() {

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
                    'isDisabled': data['health'] == 'disabled' ? true : false,
                    'isChildern': parseInt(data['age']),
                    'fam_id': parseInt(data['family_id']),
                }
                resolve();
            })
    }))

    await Promise.all(Promises)
}

function createlevelDS(p, d, levelwise_situation, passenger_id) {
    if (levelwise_situation[p] === undefined) {
        levelwise_situation[p] = { "up": {}, "down": {} };
    }
    if (d > p) {
        if (levelwise_situation[p]["up"][d] === undefined) levelwise_situation[p]["up"][d] = [];
        levelwise_situation[p]["up"][d].push(passenger_id);

    }
    else {
        if (levelwise_situation[p]["down"][d] === undefined) levelwise_situation[p]["down"][d] = [];
        levelwise_situation[p]["down"][d].push(passenger_id);
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


    for (let level in levelwise_situation) {
        if (levelwise_situation.hasOwnProperty(level)) {

            // console.log("\n upC" + up)
            // console.log("\nlevel" + level)
            // console.log("\nup" + JSON.stringify(levelwise_situation[level].up))
            // console.log("\ndOWN" + JSON.stringify(levelwise_situation[level].down))

            if (level == lifts_pos[lift_id]) {
                straightDown += Object.size(levelwise_situation[level].down)
                straightUp += Object.size(levelwise_situation[level].up)
            }
            else if (level < lifts_pos[lift_id]) {
                straightDown += Object.size(levelwise_situation[level].down)
                downThenUp += Object.size(levelwise_situation[level].up)
            }
            else if (level > lifts_pos[lift_id]) {
                straightUp += Object.size(levelwise_situation[level].up)
                upThenDown += Object.size(levelwise_situation[level].down)
            }
        }
    }
    //console.log("\nUp and Down" + up + " " + down)
    if (straightUp == 0 && straightDown == 0 && upThenDown == 0 && downThenUp == 0) return 'idle'
    if (straightUp > straightDown) return 'up';
    else if (straightUp != straightDown) return 'down';
    else if (upThenDown > downThenUp) return 'up';
    else return 'down';
}


// let x = levelwise_situation[lift_pos[lift_id]].direction;
function stopForEntry(levelwise_situation, pos, direction, requiredPeople, load, movement, lift_id) {


    //no stop as no waiting here
    if (levelwise_situation[pos] === undefined || levelwise_situation[pos][direction] === undefined || Object.size(levelwise_situation[pos][direction]) == 0) return load;


    let x = levelwise_situation[pos][direction];
    let temp = 0;

    let toBeDeletedLevels = [];

    if (Object.size(movement) != 0) Instructions[lift_id].push('STOP ' + pos)

    for (destination in x) {

        x[destination].some((passenger) => {
            if (movement[destination] === undefined) movement[destination] = [];
            movement[destination].push(passenger)
            //console.log("\nLift" + lift_id + "open")
            Instructions[lift_id].push("PASSENGER " + passenger + " ENTER")
            requiredPeople--;
            temp++;
            load++;
            if (requiredPeople == 0) return true;
        })


        x[destination].splice(0, temp);
        if (x[destination].length == 0) toBeDeletedLevels.push(destination);
        temp = 0;
        if (requiredPeople == 0) break;
    }


    toBeDeletedLevels.forEach((level) => {
        delete x[level];
    })
    levelwise_situation[pos][direction] = x;
    return load;
}

function stopForExit(lift_id, movement, i) {


    Instructions[lift_id].push('STOP ' + i)
    movement[i].forEach((passenger) => {
        Instructions[lift_id].push("PASSENGER " + passenger + " LEAVE");
    })


    let freed_load = movement[i].length
    delete movement[i];

    return freed_load;

}



function movelift(levelwise_situation, lift_id, lifts_pos, movement, dir, load) {

    // up dir
    let start_point = lifts_pos[lift_id];
    if (dir == 'up') {

        for (let i = start_point; i <= MAX_LEVEL; i++) {

            if (movement.hasOwnProperty(i)) {

                lifts_pos[lift_id] = i;
                load = load - stopForExit(lift_id, movement, i);

            }
            if (load < MAX_CAPACITY) {
                lifts_pos[lift_id] = i;
                load = stopForEntry(levelwise_situation, i, "up", MAX_CAPACITY - load, load, movement, lift_id)
            }
        }



    }
    //down dir
    if (dir == 'down') {


        for (let i = start_point; i >= MIN_LEVEL; i--) {


            if (movement.hasOwnProperty(i)) {
                lifts_pos[lift_id] = i;
                load = load - stopForExit(lift_id, movement, i);

            }
            if (load < MAX_CAPACITY) {
                lifts_pos[lift_id] = i;
                load = stopForEntry(levelwise_situation, i, "down", MAX_CAPACITY - load, load, movement, lift_id)
            }
        }
    }

    startLift(delegateWork(lift_id, lifts_pos), lifts_pos, levelwise_situation);
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


function startLift(id, lifts_pos, levelwise_situation) {
    let movement = {}
    let dir = decideDirectionOfLift(id, levelwise_situation, lifts_pos);

    //Get Passengers of Initial Level
    if (dir == 'idle') {

    }
    else {
        if (Instructions[id] === undefined) Instructions[id] = [];
        let load = stopForEntry(levelwise_situation, lifts_pos[id], dir, MAX_CAPACITY, 0, movement, id)
        Instructions[id].push('GO ' + dir.toUpperCase());

        if (Intent[id] === undefined) Intent[id] = [];
        Intent[id] = dir.toUpperCase();
        movelift(levelwise_situation, id, lifts_pos, movement, dir, load)
    }
}

function scheduleJobs(state) {

    let levelwise_situation = {}
    let lifts_pos = {}

    //grouping - to add childern clasue here
    groupPassengers(state['passenger'], levelwise_situation);

    // create lift ds
    state['lift'].forEach((lift) => createLiftDS(lift, lifts_pos))


    startLift(delegateWork(0, lifts_pos), lifts_pos, levelwise_situation);

    for (lift_id in lifts_pos) {
        if (lifts_pos[lift_id] != 1) { goToGround(lift_id) }
        if (Instructions[lift_id][Instructions[lift_id].length - 1] == "GO DOWN") { Instructions[lift_id].push('STOP 1') }
    }
}


function goToGround(lift_id) {

    if (Intent = 'UP') Instructions[lift_id].push('GO DOWN')
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
    var dir = './instructions/withoutRules';
    if (!fs.existsSync(dir, { recursive: true })) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(`${dir}/${state_file}.json`, JSON.stringify(Instructions));

}
async function run() {
    await initiateLiftSystem();

    let i = 1;

    for (state_file in states) {

        // console.log(state);
        scheduleJobs(JSON.parse(states[state_file]));
        output();
        storeFiles(state_file);
        Instructions = {};
        Intent = {}
        i++;
    }
    // states.forEach((state) => {


    // });


}
run();
// console.log(process.argv)
