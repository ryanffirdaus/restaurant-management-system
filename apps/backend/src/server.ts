import 'dotenv/config'
import app from './app.js'

const PORT: number = parseInt(process.env.PORT || '4000', 10)

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`Supabase URL: ${process.env.SUPABASE_URL}`)
})
