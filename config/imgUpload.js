'use strict'
const { Storage } = require('@google-cloud/storage')
const dateFormat = require('dateformat')
const path = require('path');

const pathKey = path.resolve('./serviceaccountkey.json')

// Konfigurasi Storage
const gcs = new Storage({
    projectId: 'warm-tome-428215-f7',
    keyFilename: pathKey
})

// Konfigurasi Bucket
const bucketName = 'recepku-bucket'
const bucket = gcs.bucket(bucketName)

// Folder di dalam bucket
const folder = 'Photo-Profile'

// Fungsi untuk membuat nama file unik
function getPublicUrl(filename) {
    return `https://storage.googleapis.com/${bucketName}/${filename}`
}

let ImgUpload = {}

ImgUpload.uploadToGcs = (req, res, next) => {
    if (!req.file) return next()

    const gcsname = `${folder}/${dateFormat(new Date(), "yyyymmdd-HHMMss")}-${req.file.originalname}`
    const file = bucket.file(gcsname)

    console.log(`Uploading to ${gcsname}`)

    const stream = file.createWriteStream({
        metadata: {
            contentType: req.file.mimetype
        }
    })

    stream.on('error', (err) => {
        console.error('Upload error:', err)
        req.file.cloudStorageError = err
        next(err)
    })

    stream.on('finish', async () => {
        try {
            await file.makePublic()
            req.file.cloudStorageObject = gcsname
            req.file.cloudStoragePublicUrl = getPublicUrl(gcsname)
            console.log(`File available at: ${req.file.cloudStoragePublicUrl}`)
            next()
        } catch (err) {
            console.error('Make public error:', err)
            next(err)
        }
    })

    stream.end(req.file.buffer)
}

// Fungsi untuk menghapus file di Google Cloud Storage
ImgUpload.deleteFromGcs = (filename) => {
    if (filename) {
        const file = bucket.file(`${folder}/${filename}`)
        file.delete().then(() => {
            console.log(`Deleted ${filename} from ${folder}`)
        }).catch(err => {
            console.error('Delete error:', err)
        })
    }
}

module.exports = ImgUpload
