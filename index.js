const HCL = require("js-hcl-parser");
const csv = require('csv-parser')
const fs = require('fs');
const util = require('util');
const { resolve } = require("path");

const pathToStates = "./states"

let states = [];
let passengersData = [];

const readFile = util.promisify(fs.readFile);
const readdir = util.promisify(fs.readdir);

async function parseAlldata() {

    //names = await fs.readdir("path/to/dir");
    let Promises = []

    let filenames = await readdir(pathToStates);
    filenames.forEach((filename) => {
        Promises.push(new Promise((resolve, reject) => {
            readFile(pathToStates + "/" + filename, 'utf-8').then((state, error) => {
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
                    'health': data['health'],
                    'age': data['age'],
                    'fam_id': data['family_id'],
                }
                resolve();

            })
    }))

    await Promise.all(Promises)

}

async function run() {
    await parseAlldata();
    console.log(passengersData[25]);
}
run();
// console.log(process.argv)
