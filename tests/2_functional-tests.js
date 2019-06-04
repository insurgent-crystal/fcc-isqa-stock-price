const chaiHttp = require('chai-http')
const chai     = require('chai')
const assert   = chai.assert
const server   = require('../server')

chai.use(chaiHttp)

suite('Functional Tests', () => {
    
    suite('GET /api/stock-prices => stockData object', () => {
      
      const totallyRandomNumber = process.env.RANDOM_NUMBER
      
      
      test('1 stock', done => {
        chai.request(server)
          .get('/api/stock-prices')
          .set('x-forwarded-for', totallyRandomNumber)
          .query({
            stock: 'goog'
          })
          .end((err, res) => {
            assert.equal(res.status, 200)
            assert.equal(res.body.stockData.stock, 'GOOG')

            done()
          })
      })
      
      test('1 stock with like', done => {
        chai.request(server)
          .get('/api/stock-prices')
          .set('x-forwarded-for', totallyRandomNumber)
          .query({
            stock: 'goog'
          })
          .end((err, res) => {
            const likes = res.body.stockData.likes

            chai.request(server)
              .get('/api/stock-prices')
              .set('x-forwarded-for', totallyRandomNumber)
              .query({
                stock: 'goog',
                like: 'true'
              })
              .end((err, res) => {
                assert.equal(res.body.stockData.likes, likes + 1)

                done()
              })
          })
      })
      
      test('1 stock with like again (ensure likes arent double counted)', done => {
        chai.request(server)
          .get('/api/stock-prices')
          .set('x-forwarded-for', totallyRandomNumber)
          .query({
            stock: 'goog'
          })
          .end((err, res) => {
            const likes = res.body.stockData.likes

            chai.request(server)
              .get('/api/stock-prices')
              .set('x-forwarded-for', totallyRandomNumber)
              .query({
                stock: 'goog',
                like: 'true'
              })
              .end((err, res) => {
                assert.equal(res.body.stockData.likes, likes)

                done()
              })
          })
      })
      
      test('2 stocks', done => {
        chai.request(server)
          .get('/api/stock-prices')
          .set('x-forwarded-for', totallyRandomNumber)
          .query({
            stock: ['amzn', 'msft']
          })
          .end((err, res) => {
            assert.equal(res.status, 200)
            assert.equal(res.body.stockData[0].stock, 'AMZN')
            assert.equal(res.body.stockData[1].stock, 'MSFT')

            done()
          })
      })
      
      //Nested monstrosity
      test('2 stocks with like', done => {
        
        //1st | amzn likes
        chai.request(server)
        .get('/api/stock-prices')
        .set('x-forwarded-for', totallyRandomNumber)
        .query({
          stock: 'amzn'
        })
        .end((err, initialResAMZN) => {
          const initLikesAMZN = initialResAMZN.body.stockData.likes
        
        //2nd | msft likes
        chai.request(server)
        .get('/api/stock-prices')
        .set('x-forwarded-for', totallyRandomNumber)
        .query({
          stock: 'msft'
        })
        .end((err, initialResMSFT) => {
          const initLikesMSFT = initialResMSFT.body.stockData.likes
        
        //3rd | liking
        chai.request(server)
        .get('/api/stock-prices')
        .set('x-forwarded-for', totallyRandomNumber)
        .query({
          stock: ['amzn', 'msft'],
          like: 'true'
        })
        .end((err, likeRes) => {
          
        //4th | amzn likes
        chai.request(server)
        .get('/api/stock-prices')
        .set('x-forwarded-for', totallyRandomNumber)
        .query({
          stock: 'amzn',
        })
        .end((err, resAMZN) => {
          const likesAMZN = resAMZN.body.stockData.likes
        
        //5th | msft likes | final
        chai.request(server)
        .get('/api/stock-prices')
        .set('x-forwarded-for', totallyRandomNumber)
        .query({
          stock: 'msft'
        })
        .end((err, resMSFT) => {
          const likesMSFT = resMSFT.body.stockData.likes
          
          //final
          assert.equal(likesAMZN, initLikesAMZN + 1)
          assert.equal(likesMSFT, initLikesMSFT + 1)
          
          done()
        }) // 5
        }) // 4
        }) // 3
        }) // 2
        }) // 1
        
      })
      
    })

})
