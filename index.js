import util from 'util'
import path from 'path'
import ytdl from 'ytdl-core'
import express from 'express'
import { fileURLToPath } from 'url'
import * as functions from './function.js'
import * as scraper from '@bochilteam/scraper'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
app.set('json spaces', 2)
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const log = (txt) => console.log(`\u001b[102m[${new Date().toLocaleTimeString('id', { timeZone: 'Asia/Jakarta' })}]\u001b[49m ${util.format(txt)}`)
let configOptions = {
	highWaterMark: 1 << 25,
	requestOptions: { headers: { 'cookie': 'ID=' + new Date().getTime(), 'x-youtube-identity-token': 'AIzaSyAHktqFAx7cjOHsVunYScXZMQjv9bLuHVA\u003d' }}
}

// Route for Download endpoint
app.get('/*.*', async (req, res) => {
	if (!req.url.split('?')[0].split('.')[0].slice(1).length) return res.redirect('/')
	if (req.url.includes('favicon')) return res.end()
	let url = req.query.url,
	contenttype = req.query.contenttype,
	filter = (req.query.filter || 'audioandvideo').toLowerCase(),
	quality = (req.query.quality || 'highestvideo').toLowerCase()
	try {
		if (/audio/.test(filter)) quality = 'highest'
		if (contenttype) res.setHeader('content-type', contenttype)
		let stream = await ytdl(req.url.split('?')[0].split('.')[0].slice(1), { quality, filter, ...configOptions }).on('error', (err) => {
			log(err)
			return res.json({ url, err })
		}).on('info', (info) => {
			log(`${info.videoDetails.title} (${info.formats[0].qualityLabel})`)
			if (!contenttype) res.setHeader('content-type', info.formats[0].mimeType)
			stream.pipe(res)
		})
	} catch (err) {
		log(err)
		return res.json({ url, err })
	}
})
app.get('/', (req, res) => {
	if (req.query.url) {
		try {
			ytdl.getVideoID(req.query.url, configOptions)
		} catch (err) {
			log(err)
			return res.send(String(err))
		}
		return res.redirect(`/${ytdl.getVideoID(req.query.url, configOptions)}.${req.query.contenttype.split('/')[1] || 'mp4'}?filter=${req.query.filter || ''}&quality=${req.query.quality || ''}&contenttype=${req.query.contenttype || ''}`)
	} else {
		res.sendFile(__dirname + '/index.html')
	}
})

app.get('/yt', (req, res) => {
	if (req.query.url) {
		try {
			ytdl.getVideoID(req.query.url, configOptions)
		} catch (err) {
			log(err)
			return res.send(String(err))
		}
		ytdl.getInfo(req.query.url, configOptions).then(({ formats, videoDetails }) => {
			log(videoDetails.title)
			res.json({ result: { videoDetails, formats }})
		})
	} else {
		res.json({ message: 'Input parameter url!' })
	}
})
app.get('/eval', async (req, res) => {
	let text = req.query.query || req.query.q
	let out
	try {
		out = await eval(`(async () => { ${text} })()`)
	} catch (e) {
		out = e
	} finally {
		res.send(util.format(out))
	}
})
app.get(['/runtime', '/uptime'], (req, res) => {
	res.send(functions.clockString(process.uptime()))
})

// Listen....
const listener = app.listen(process.env.PORT || 3000 || 8080, () => {
	log(`QYTDL is running on port ${listener.address().port}`)
})

