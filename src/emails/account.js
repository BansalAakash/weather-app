const api_key = process.env.MAIL_GUN_API_KEY
const DOMAIN = 'sandbox32ce438ea0604074b5dfc854732babed.mailgun.org'

const mailgun = require("mailgun-js")

const mg = mailgun({apiKey: api_key, domain: DOMAIN})

const welcomeEmail = (email, name) => {
	const welcomeEmailBody = {
		from: 'aakash6025@gmail.com',
		to: email,
		subject: 'Thanks for joining in',
		text: `Welcome to the app, ${name}. Let me know how you get along with the app`
	}
	console.log(welcomeEmailBody)
	// console.log(api_key)
	mg.messages().send(welcomeEmailBody, function (error, body) {
		// if(error)
		// 	console.log(error)
		// else
		// 	console.log(body)
})}

const exitEmail = (email, name) => {
	const exitEmailBody = {
		from: 'aakash6025@gmail.com',
		to: email,
		subject: 'Sad to see you go',
		text: `${name}, Could you let us know what we could've done better`
	}
	console.log(exitEmailBody)
	mg.messages().send(exitEmailBody, function (error, body) {
		// if(error)
		// 	console.log(error)
		// else
		// 	console.log(body)
})}



module.exports = {
	welcomeEmail,
	exitEmail
}