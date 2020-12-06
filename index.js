const HCL = require("js-hcl-parser");
const csv = require('csv-parser')
const fs = require('fs');
const util = require('util');
const { Engine } = require('json-rules-engine');

const pathToStates = "./states"

let states = [];
let passengersData = [];

const readFile = util.promisify(fs.readFile);
const readdir = util.promisify(fs.readdir);

// function setupRules() {
//     let engine = new Engine()



// To get all data ready so we dont process it again and again
async function initiateLiftSystem() {

    //names = await fs.readdir("path/to/dir");
    let Promises = []

    let filenames = await readdir(pathToStates);
    filenames.forEach((filename) => {
        Promises.push(new Promise((resolve, reject) => {
            readFile(pathToStates + "/" + 'state_9.hcl', 'utf-8').then((state, error) => {
                states.push(HCL.parse(state));
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

// function allotlift()

function createDataStructure(p, d, floorwise_situation, passenger_id) {
    if (floorwise_situation[p] === undefined) {
        floorwise_situation[p] = { "up": {}, "down": {} };
    }
    if (d > p) {
        if (floorwise_situation[p]["up"][d] === undefined) floorwise_situation[p]["up"][d] = [];
        floorwise_situation[p]["up"][d].push(passenger_id);

    }
    else {
        if (floorwise_situation[p]["down"][d] === undefined) floorwise_situation[p]["down"][d] = [];
        floorwise_situation[p]["down"][d].push(passenger_id);
    }
}

function scheduleJobs(state) {
    let jobsQueue = state['passenger'];
    let floorwise_situation = {}



    //grouping
    jobsQueue.forEach((job) => {
        let d = job["goto_level"];
        let p = job["at_level"];
        createDataStructure(p, d, floorwise_situation, job["id"]);

    }
    )
    console.log(floorwise_situation[1]["up"])
    // console.log(floorwise_situation);

}
async function run() {
    await initiateLiftSystem();
    // console.log(states);
    // states.forEach(scheduleJobs);z

    scheduleJobs(JSON.parse(states[3]));

}
run();
// console.log(process.argv)
