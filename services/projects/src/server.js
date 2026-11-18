require('dotenv').config()

const app = require('./app')
const { connectDatabase } = require('./db')

const port = Number(process.env.PORT || 3000)

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Projects Service escuchando en el puerto ${port}`)
    })
  })
  .catch((error) => {
    console.error('No se pudo iniciar Projects Service:', error.message)
    process.exitCode = 1
  })
