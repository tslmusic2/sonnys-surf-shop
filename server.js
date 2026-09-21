import path from 'node:path'
import fs from 'node:fs/promises'
import http from 'node:http'
import { sendResponse } from './utilities/sendResponse.js'
import { getRequestBody } from './utilities/getRequestBody.js'

const PORT = 8005

const __dirname = import.meta.dirname

const ordersFilePath = path.join(__dirname, 'data', 'orders.json')
const surfboardInventoryFilePath = path.join(__dirname, 'data', 'surfboardInventory.json')


const server = http.createServer(async (req, res) => {

    //Here so this works on my local network----------
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE OPTIONS')

    if (req.method === 'OPTIONS') {
    res.statusCode = 204
    return res.end()
    }
    //-------------------------------------------------


    try {

        if (req.url === '/api/surfboard-inventory' && req.method === 'GET') {

                const surfboardInventoryFile = await fs.readFile(surfboardInventoryFilePath, 'utf8')
                const parsedsurfboardInventoryFile = JSON.parse(surfboardInventoryFile)


                return sendResponse(
                    res,
                    200,
                    'application/json',
                    JSON.stringify(parsedsurfboardInventoryFile, 'utf8')
                )
        }


        if (req.url === '/api/orders' && req.method === 'POST') {


        }


        if (req.url.startsWith('/api/surfboard-inventory') && req.method === 'DELETE') {

            const id = Number(req.url.split('/').pop())

            const surfboardInventoryFile = await fs.readFile(
                surfboardInventoryFilePath, 'utf8'
            )
            const parsedsurfboardInventoryFile = JSON.parse(
                surfboardInventoryFile
            )

            const updatedSurfboardInventory = parsedsurfboardInventoryFile.filter(
                surfboard => surfboard.id !== id
            )

            await fs.writeFile(
                surfboardInventoryFilePath, 
                JSON.stringify(updatedSurfboardInventory, null, 2),
                'utf8'
                )


            return sendResponse(
                res,
                200,
                'aplication/json',
                JSON.stringify({message: 'item was deleted successfully'})
            )


        }


        


    } catch(err) {
        console.log(err)
        return sendResponse (
            res,
            500,
            'application/json',
            JSON.stringify({error: 'There was an issue with the server'})
        )
    }



})

server.listen(PORT, () => console.log(`Connected on port: ${PORT}`))