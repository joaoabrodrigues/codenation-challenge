const fs = require('fs')
const axios = require('axios')
const crypto = require('crypto')
const FormData = require('form-data')

const env = require('../.env')

const { url, urlSubmit, filename } = require('./config')

axios.get(`${url}${env.token}`).then(res => {
    var jsonObject = res.data

    const decryptedMessage = decrypt(jsonObject.cifrado, jsonObject.numero_casas)
    const sha1Crypt = crypto.createHash('sha1').update(decryptedMessage).digest('hex')

    jsonObject.decifrado = decryptedMessage
    jsonObject.resumo_criptografico = sha1Crypt

    saveFile(JSON.stringify(jsonObject))

    const formData = createFormData()
    const config = { headers: formData.getHeaders() }

    submitChallenge(formData, config)
})

function submitChallenge(formData, config) {
    axios.post(`${urlSubmit}${env.token}`, formData, config).then(res => {
        console.log('Success! Score:', res.data.score)
    }).catch(err => {
        if (err && err.response && err.response.data) {
            console.log('Error on posting file', err.response.data)
        }
        else {
            console.log('Error on request', err)
        }
    }).then(() => {
        fs.unlinkSync(filename)
        console.log('JSON file deleted!')
    })
}

function decrypt(str, amount) {     
	var output = ''

	for (var i = 0; i < str.length; i ++) {
		var c = str[i]
		if (c.match(/[a-z]/i)) {
            var code = str.charCodeAt(i)
            c = String.fromCharCode(((code - 97 - amount) % 26) + 97)
		}
		output += c
    }

	return output
}

function saveFile(jsonData) {
    fs.writeFileSync(filename, jsonData)
    console.log('JSON file created!')
}

function getFile() {
    return fs.readFileSync(filename)
}

function createFormData() {
    const formData = new FormData()
    formData.append('answer', getFile(), { filename: filename })
    return formData
}