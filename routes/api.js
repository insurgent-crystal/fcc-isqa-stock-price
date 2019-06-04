'use strict'

const mongodb     = require('mongodb')
const MongoClient = require('mongodb').MongoClient
const ObjectId    = require('mongodb').ObjectID
const si          = require('stock-info')

const connection = MongoClient.connect(process.env.DATABASE, {useNewUrlParser: true})

module.exports = app => {

  app.route('/api/stock-prices')
    .get((req, res) => {
      
      const like = req.query.like === 'true' ? true : false
      const ip = req.headers['x-forwarded-for'].split(',')[0]
      // console.log('stock: ' + req.query.stock) //
      // console.log('is query array? ' + Array.isArray(req.query.stock)) //
      // console.log('like: ' + like) //
      
      //1 stock case: DONE (shitcode)
    
      // if 1+     [1+]
      // | res 1+ 
      // else      [1=]
      // | res 1=
      
      if (typeof req.query.stock === 'string') {
        si.getSingleStockInfo(req.query.stock)
        .then(stockData => {
        //stock info stock info stock info stock info
        
        connection.then(client => {
          //db db db db db db db db db db db db db db db db
          
          const db = client.db('stock-price-checker')
          
          db.collection('stocks')
            .findOneAndUpdate({
              stock: req.query.stock
            }, {
              $setOnInsert: {
                stock: req.query.stock,
                likes: 0,
                ips: []
              }
            }, {
              upsert: true
            })
            .then(stockDB => {
            //result result result result result result 
            
            if (like && (stockDB.value === null || stockDB.value.ips.indexOf(ip) === -1)) {
              //like like like like like like like like
              
              db.collection('stocks')
                .findOneAndUpdate({
                  stock: req.query.stock
                }, {
                  $inc: {likes: 1},
                  $push: {ips: ip}
                })
                .then(updatesStockDB => {
                  return res.json({
                    stockData: {
                      stock: stockData.symbol,
                      price: stockData.regularMarketPrice.toString(),
                      likes: updatesStockDB.value.likes + 1
                    }
                  })
                })
                .catch(error => {
                  console.log('Database error: ' + error)
                  return res.type('text').send('couldn\'t receive stock data')
                })
              
              //like like like like like like like like end
            } else {
              return res.json({
                stockData: {
                  stock: stockData.symbol,
                  price: stockData.regularMarketPrice.toString(),
                  likes: stockDB.value ? stockDB.value.likes : 0
                }
              })
            }
            
            //result result result result result result end
            })
            .catch(error => {
              console.log('Database error: ' + error)
              return res.type('text').send('couldn\'t receive stock data')
            })
            
          //db db db db db db db db db db db db db db db db end
        })
        .catch(error => {
          console.log('Connection error: ' + error)
          return res.type('text').send('database connection error')
        })
        
      })
      .catch(error => {
        console.log('stock-info error: ' + error)
        return res.type('text').send('invalid symbol')
      })
          
      //stock info stock info stock info stock info end
      }
      
      //2 stocks case: DONE (super shitcode)
      
      // if 1+          [1+ 2?]
      // | if 2+        [1+ 2+]
      // | | res 1+ 2+
      // | else         [1+ 2=]
      // | | res 1+ 2=
      // else if 2+     [1= 2+]
      // | res 1= 2+
      // else           [1= 2=]
      // | res 1= 2=
      
      if (Array.isArray(req.query.stock) && req.query.stock.length === 2) {
        const firstStock  = req.query.stock[0]
        const secondStock = req.query.stock[1]
        
        si.getStocksInfo([firstStock, secondStock])
        .then(stockData => {
        //stock info stock info stock info stock info
        
        connection.then(client => {
          //db db db db db db db db db db db db db db db db
          
          const db = client.db('stock-price-checker')
          
          db.collection('stocks')
            .findOneAndUpdate({
              stock: firstStock
            }, {
              $setOnInsert: {
                stock: firstStock,
                likes: 0,
                ips: []
              }
            }, {
              upsert: true
            })
            .then(firstStockDB => {
            //second query second query second query 
            
            db.collection('stocks')
              .findOneAndUpdate({
                stock: secondStock
              }, {
                $setOnInsert: {
                  stock: secondStock,
                  likes: 0,
                  ips: []
                }
              }, {
                upsert: true
              })
              .then(secondStockDB => {
              //result result result result result result 

              if (like && (firstStockDB.value === null || firstStockDB.value.ips.indexOf(ip) === -1)) {
              //like like like like like like like like
              
                db.collection('stocks')
                  .findOneAndUpdate({
                    stock: firstStock
                  }, {
                    $inc: {likes: 1},
                    $push: {ips: ip}
                  })
                  .then(updatesFirstStockDB => {
                  //like2 like2 like2 like2 like2 like2 like2 like2
                  
                  if (like && (secondStockDB.value === null || secondStockDB.value.ips.indexOf(ip) === -1)) {
                  //like like like like like like like like

                    db.collection('stocks')
                      .findOneAndUpdate({
                        stock: secondStock
                      }, {
                        $inc: {likes: 1},
                        $push: {ips: ip}
                      })
                      .then(updatesSecondStockDB => {
                      //like2 like2 like2 like2 like2 like2 like2 like2

                      const firstLikes   = updatesFirstStockDB.value.likes + 1
                      const secondLikes  = updatesSecondStockDB.value.likes + 1

                      return res.json({
                        stockData: [{
                          stock: stockData[0].symbol,
                          price: stockData[0].regularMarketPrice.toString(),
                          rel_likes: firstLikes - secondLikes
                        }, {
                          stock: stockData[1].symbol,
                          price: stockData[1].regularMarketPrice.toString(),
                          rel_likes: secondLikes - firstLikes
                        }]
                      })

                      //like2 like2 like2 like2 like2 like2 like2 like2 end
                      })
                      .catch(error => {
                        console.log('Database error: ' + error)
                        return res.type('text').send('couldn\'t receive stock data')
                      })

                    //like like like like like like like like end
                  } else {
                    const firstLikes  = updatesFirstStockDB.value.likes + 1
                    const secondLikes = secondStockDB.value ? secondStockDB.value.likes : 0

                    return res.json({
                      stockData: [{
                        stock: stockData[0].symbol,
                        price: stockData[0].regularMarketPrice.toString(),
                        rel_likes: firstLikes - secondLikes
                      }, {
                        stock: stockData[1].symbol,
                        price: stockData[1].regularMarketPrice.toString(),
                        rel_likes: secondLikes - firstLikes
                      }]
                    })
                  }
                  
                  })
                  .catch(error => {
                    console.log('Database error: ' + error)
                    return res.type('text').send('couldn\'t receive stock data')
                  })

                //like like like like like like like like end
              } else if (like && (secondStockDB.value === null || secondStockDB.value.ips.indexOf(ip) === -1)) {
              //like like like like like like like like

                db.collection('stocks')
                  .findOneAndUpdate({
                    stock: secondStock
                  }, {
                    $inc: {likes: 1},
                    $push: {ips: ip}
                  })
                  .then(updatesSecondStockDB => {
                  //like2 like2 like2 like2 like2 like2 like2 like2

                  const firstLikes  = firstStockDB.value ? firstStockDB.value.likes  : 0
                  const secondLikes = updatesSecondStockDB.value.likes + 1

                  return res.json({
                    stockData: [{
                      stock: stockData[0].symbol,
                      price: stockData[0].regularMarketPrice.toString(),
                      rel_likes: firstLikes - secondLikes
                    }, {
                      stock: stockData[1].symbol,
                      price: stockData[1].regularMarketPrice.toString(),
                      rel_likes: secondLikes - firstLikes
                    }]
                  })

                  //like2 like2 like2 like2 like2 like2 like2 like2 end
                  })
                  .catch(error => {
                    console.log('Database error: ' + error)
                    return res.type('text').send('couldn\'t receive stock data')
                  })

                //like like like like like like like like end
              } else {
                const firstLikes  = firstStockDB.value  ? firstStockDB.value.likes  : 0
                const secondLikes = secondStockDB.value ? secondStockDB.value.likes : 0
                
                return res.json({
                  stockData: [{
                    stock: stockData[0].symbol,
                    price: stockData[0].regularMarketPrice.toString(),
                    rel_likes: firstLikes - secondLikes
                  }, {
                    stock: stockData[1].symbol,
                    price: stockData[1].regularMarketPrice.toString(),
                    rel_likes: secondLikes - firstLikes
                  }]
                })
              }

              //result result result result result result end
              })
              .catch(error => {
                console.log('Database error: ' + error)
                return res.type('text').send('couldn\'t receive stock data')
              })
            
            //second query second query second query end
            })
            .catch(error => {
              console.log('Database error: ' + error)
              return res.type('text').send('couldn\'t receive stock data')
            })
            
          //db db db db db db db db db db db db db db db db end
        })
        .catch(error => {
          console.log('Connection error: ' + error)
          return res.type('text').send('database connection error')
        })
        
      })
      .catch(error => {
        console.log('stock-info error: ' + error)
        return res.type('text').send('invalid symbol')
      })
          
      }
      
    })
  
}