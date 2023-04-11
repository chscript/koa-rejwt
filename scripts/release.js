// Update the version number in README.md

import fs from 'node:fs'
import npm from '../package.json' assert { type: 'json' }

const READMEs = ['./README.md', './README_zh.md']

const versionRegExp =
    /(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?/g

function read(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf-8', (err, data) => {
            if (err) {
                reject(err)
            }
            resolve(data)
        })
    })
}

function write(path, data, versionNumber, labelColor) {
    return new Promise((resolve, reject) => {
        fs.writeFile(
            path,
            data.replace(
                versionRegExp,
                versionNumber.replace('-', '--') + labelColor
            ),
            'utf-8',
            err => {
                if (err) {
                    reject(err)
                }
                resolve()
            }
        )
    })
}

async function UpdateVersion(path, versionNumber, labelColor) {
    const data = await read(path)
    await write(path, data, versionNumber, labelColor)
}

READMEs.forEach(readme => {
    UpdateVersion(readme, npm.version, '-blue')
})
