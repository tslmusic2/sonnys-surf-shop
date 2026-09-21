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

            const parsedReqBody = await getRequestBody(req)

            const surfboardInventoryFile = await fs.readFile(surfboardInventoryFilePath, 'utf8')
            const parsedSurfboardInventoryFile = JSON.parse(surfboardInventoryFile)


            for (const orderedItem of parsedReqBody.items) {
                const product = parsedSurfboardInventoryFile.find(
                    item => item.id === orderedItem.id
                )

                if (!product) {
                    return sendResponse(
                        res,
                        404,
                        'application/json',
                        JSON.stringify({error: 'Item Not Found'})
                    )
                }

                if (orderedItem.quantity <= 0) {
                    return sendResponse(
                        res,
                        400,
                        'application/json',
                        JSON.stringify({error: 'Invalid Order'})
                    )
                }

                if (orderedItem.quantity > product.quantity) {
                    return sendResponse(
                        res,
                        409,
                        'application/json',
                        JSON.stringify({error: 'Not enough in stock'})
                    )
                }

            }


            let priceTotal = 0
            const fullOrder = []


            for (const orderedItem of parsedReqBody.items) {
                const product = parsedSurfboardInventoryFile.find(
                    item => item.id === orderedItem.id
                )

                product.quantity -= orderedItem.quantity
                const itemTotal = product.price * orderedItem.quantity
                priceTotal += itemTotal


                fullOrder.push({
                    "id": product.id,
                    "name": product.name,
                    "brand": product.brand,
                    "quantity": orderedItem.quantity,
                    "price": product.price,
                    "priceTotal": itemTotal
                })
            }


            const ordersFile = await fs.readFile(ordersFilePath, 'utf8')
            const parsedOrdersFile = JSON.parse(ordersFile)

            const orderId = parsedOrdersFile.length > 0 ?
                Math.max(...parsedOrdersFile.map(order => order.id + 1)) : 1

            
            const newOrder = {
                "id": orderId,
                "items": fullOrder,
                "totalPrice": Math.round(priceTotal * 100) / 100
            }

            parsedOrdersFile.push(newOrder)

            await fs.writeFile(surfboardInventoryFilePath, JSON.stringify(parsedSurfboardInventoryFile, null, 2), 'utf8')
            await fs.writeFile(ordersFilePath, JSON.stringify(parsedOrdersFile, null, 2), 'utf8')

            return sendResponse(
                res,
                200,
                'aplication/json',
                JSON.stringify({message: 'Your Order was Processed successfully'})
            )

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